-- Cinemap aggregate analytics RPC
--
-- Purpose:
--   Return aggregate-only analytics for local reporting without exposing raw
--   cinemap_events rows through anon REST access.
--
-- Privacy contract:
--   - Does not return visitor_id or session_id.
--   - Does not return raw rows.
--   - Does not return reaction.
--   - Search/no-result queries are returned only when count >= 3.
--   - Keeps raw cinemap_events SELECT private; this only grants EXECUTE on
--     the aggregate function.
--
-- Install:
--   Paste this file into Supabase SQL Editor and run it.
--
-- Test:
--   select public.cinemap_analytics_summary(7);

create or replace function public.cinemap_analytics_summary(days_back integer default 7)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with scoped as (
  select
    created_at,
    visitor_id,
    session_id,
    event_type,
    movie,
    movie_ar,
    release_date,
    genre,
    selected_filter,
    search_query,
    device_type,
    rating,
    vibes,
    language,
    page_path
  from public.cinemap_events
  where created_at >= now() - make_interval(days => greatest(coalesce(days_back, 7), 1))
),
overview as (
  select jsonb_build_object(
    'total_events', count(*),
    'unique_visitors', count(distinct visitor_id),
    'unique_sessions', count(distinct session_id),
    'first_event_at', min(created_at),
    'latest_event_at', max(created_at)
  ) as data
  from scoped
),
event_breakdown as (
  select coalesce(jsonb_agg(to_jsonb(row_data) order by row_data.event_count desc, row_data.event_type), '[]'::jsonb) as data
  from (
    select event_type, count(*)::integer as event_count
    from scoped
    group by event_type
    order by event_count desc, event_type
    limit 50
  ) row_data
),
daily_traffic as (
  select coalesce(jsonb_agg(to_jsonb(row_data) order by row_data.date), '[]'::jsonb) as data
  from (
    select
      created_at::date as date,
      count(*)::integer as total_events,
      count(distinct visitor_id)::integer as unique_visitors,
      count(distinct session_id)::integer as unique_sessions
    from scoped
    group by created_at::date
    order by created_at::date
  ) row_data
),
funnel as (
  select jsonb_build_object(
    'page_view_sessions', count(distinct session_id) filter (where event_type = 'page_view'),
    'movie_open_sessions', count(distinct session_id) filter (where event_type = 'movie_open'),
    'save_movie_sessions', count(distinct session_id) filter (where event_type = 'save_movie'),
    'watched_movie_sessions', count(distinct session_id) filter (where event_type = 'watched_movie'),
    'rating_submitted_sessions', count(distinct session_id) filter (where event_type = 'rating_submitted'),
    'search_used_sessions', count(distinct session_id) filter (where event_type = 'search_used'),
    'watchlist_open_sessions', count(distinct session_id) filter (where event_type = 'watchlist_open'),
    'my2026_sessions', count(distinct session_id) filter (where event_type in (
      'my2026_lite_view',
      'my2026_nav_click',
      'my2026_lite_empty_cta_click',
      'my2026_card_view',
      'my_list_open'
    ))
  ) as data
  from scoped
),
movie_counts as (
  select
    event_type,
    coalesce(movie, 'unknown') as movie,
    max(movie_ar) as movie_ar,
    release_date,
    count(*)::integer as event_count,
    row_number() over (
      partition by event_type
      order by count(*) desc, coalesce(movie, 'unknown')
    ) as rn
  from scoped
  where event_type in (
    'movie_open',
    'save_movie',
    'watched_movie',
    'rating_submitted',
    'calendar_click',
    'share_movie'
  )
    and (movie is not null or movie_ar is not null)
  group by event_type, coalesce(movie, 'unknown'), release_date
),
top_movies as (
  select coalesce(jsonb_agg(to_jsonb(row_data) order by row_data.event_type, row_data.event_count desc), '[]'::jsonb) as data
  from (
    select event_type, movie, movie_ar, release_date, event_count as count
    from movie_counts
    where rn <= 20
  ) row_data
),
rating_overview as (
  select jsonb_build_object(
    'total_ratings', count(*) filter (where rating is not null),
    'average_rating', round(avg(rating)::numeric, 2)
  ) as data
  from scoped
  where event_type = 'rating_submitted'
),
rating_by_movie as (
  select coalesce(jsonb_agg(to_jsonb(row_data) order by row_data.rating_count desc, row_data.average_rating desc), '[]'::jsonb) as data
  from (
    select
      coalesce(movie, 'unknown') as movie,
      max(movie_ar) as movie_ar,
      release_date,
      count(*)::integer as rating_count,
      round(avg(rating)::numeric, 2) as average_rating
    from scoped
    where event_type = 'rating_submitted'
      and rating is not null
      and (movie is not null or movie_ar is not null)
    group by coalesce(movie, 'unknown'), release_date
    order by rating_count desc, average_rating desc
    limit 50
  ) row_data
),
rating_distribution as (
  select coalesce(jsonb_agg(to_jsonb(row_data) order by row_data.rating), '[]'::jsonb) as data
  from (
    select rating, count(*)::integer as count
    from scoped
    where event_type = 'rating_submitted'
      and rating is not null
    group by rating
    order by rating
  ) row_data
),
search_used as (
  select coalesce(jsonb_agg(to_jsonb(row_data) order by row_data.count desc, row_data.query), '[]'::jsonb) as data
  from (
    select search_query as query, count(*)::integer as count
    from scoped
    where event_type = 'search_used'
      and search_query is not null
      and search_query <> '[redacted]'
    group by search_query
    having count(*) >= 3
    order by count desc, query
    limit 50
  ) row_data
),
search_no_results as (
  select coalesce(jsonb_agg(to_jsonb(row_data) order by row_data.count desc, row_data.query), '[]'::jsonb) as data
  from (
    select search_query as query, count(*)::integer as count
    from scoped
    where event_type = 'search_no_results'
      and search_query is not null
      and search_query <> '[redacted]'
    group by search_query
    having count(*) >= 3
    order by count desc, query
    limit 50
  ) row_data
),
search_counts as (
  select jsonb_build_object(
    'total_searches', count(*) filter (where event_type = 'search_used'),
    'total_no_result_searches', count(*) filter (where event_type = 'search_no_results'),
    'privacy_threshold', 3
  ) as data
  from scoped
),
filter_insights as (
  select coalesce(jsonb_agg(to_jsonb(row_data) order by row_data.count desc, row_data.selected_filter), '[]'::jsonb) as data
  from (
    select selected_filter, count(*)::integer as count
    from scoped
    where event_type in ('filter_used', 'filter_apply', 'filter_open')
      and selected_filter is not null
    group by selected_filter
    order by count desc, selected_filter
    limit 50
  ) row_data
),
my2026_insights as (
  select coalesce(jsonb_agg(to_jsonb(row_data) order by row_data.count desc, row_data.event_type), '[]'::jsonb) as data
  from (
    select event_type, count(*)::integer as count
    from scoped
    where event_type in (
      'my2026_lite_view',
      'my2026_nav_click',
      'my2026_lite_empty_cta_click',
      'my2026_card_view',
      'my_list_open'
    )
    group by event_type
    order by count desc, event_type
  ) row_data
),
visitor_rollup as (
  select
    visitor_id,
    count(*) as event_count,
    count(distinct session_id) as session_count
  from scoped
  where visitor_id is not null
  group by visitor_id
),
retention_proxy as (
  select jsonb_build_object(
    'visitors_with_2_plus_sessions', count(*) filter (where session_count >= 2),
    'visitors_with_3_plus_events', count(*) filter (where event_count >= 3),
    'visitors_with_5_plus_events', count(*) filter (where event_count >= 5),
    'average_events_per_visitor', round(avg(event_count)::numeric, 2)
  ) as data
  from visitor_rollup
)
select jsonb_build_object(
  'meta', jsonb_build_object(
    'days_back', greatest(coalesce(days_back, 7), 1),
    'generated_at', now(),
    'source', 'cinemap_analytics_summary',
    'privacy', 'aggregate_only'
  ),
  'overview', (select data from overview),
  'event_breakdown', (select data from event_breakdown),
  'daily_traffic', (select data from daily_traffic),
  'funnel', (select data from funnel),
  'top_movies', (select data from top_movies),
  'rating_insights', jsonb_build_object(
    'overview', (select data from rating_overview),
    'by_movie', (select data from rating_by_movie),
    'distribution', (select data from rating_distribution)
  ),
  'search_insights', jsonb_build_object(
    'overview', (select data from search_counts),
    'top_searches', (select data from search_used),
    'top_no_result_searches', (select data from search_no_results)
  ),
  'filter_insights', (select data from filter_insights),
  'my2026_insights', (select data from my2026_insights),
  'retention_proxy', (select data from retention_proxy),
  'privacy', jsonb_build_object(
    'raw_rows_exposed', false,
    'visitor_id_exposed', false,
    'session_id_exposed', false,
    'reaction_exposed', false,
    'search_min_count', 3
  )
);
$$;

revoke all on function public.cinemap_analytics_summary(integer) from public;
grant execute on function public.cinemap_analytics_summary(integer) to anon, authenticated;

comment on function public.cinemap_analytics_summary(integer)
is 'Aggregate-only Cinemap analytics summary. Does not expose raw cinemap_events rows, visitor_id, session_id, reaction, or rare search queries.';
