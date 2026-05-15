#!/usr/bin/env node
/*
 * Cinemap analytics report
 *
 * Run locally with anon credentials only:
 *
 *   SUPABASE_URL="https://<project-ref>.supabase.co" \
 *   SUPABASE_ANON_KEY="<anon-or-publishable-key>" \
 *   node tools/cinemap-analytics-report.js
 *
 * Optional:
 *   DAYS=7 node tools/cinemap-analytics-report.js
 *   CINEMAP_ANALYTICS_TABLE=cinemap_events node tools/cinemap-analytics-report.js
 *   node tools/cinemap-analytics-report.js --json reports/analytics-7d.json
 *
 * Do not put real keys in this file. Generated reports should stay local.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_DAYS = 30;
const DEFAULT_TABLE = 'cinemap_events';
const PAGE_SIZE = 1000;

const ALL_FIELDS = [
  'created_at',
  'visitor_id',
  'session_id',
  'event_type',
  'movie_id',
  'movie',
  'movie_ar',
  'release_date',
  'genre',
  'selected_filter',
  'search_query',
  'device_type',
  'city',
  'rating',
  'vibes',
  'reaction',
  'language',
  'page_path',
];

const EVENT_GROUPS = {
  pageView: ['page_view'],
  movieOpen: ['movie_open'],
  save: ['save_movie'],
  unsave: ['unsave_movie'],
  watched: ['watched_movie'],
  unwatched: ['unwatched_movie'],
  rating: ['rating_submitted'],
  search: ['search_used'],
  searchNoResults: ['search_no_results'],
  filter: ['filter_used', 'filter_apply', 'filter_open'],
  watchlistOpen: ['watchlist_open'],
  my2026: ['my2026_lite_view', 'my2026_card_view', 'my_list_open'],
  calendar: ['calendar_click', 'notify_interest'],
  share: ['share_movie', 'share_card_generated', 'share_card_downloaded'],
};

function argValue(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  return process.argv[idx + 1] || null;
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Example: ${name}="..." node tools/cinemap-analytics-report.js`);
  }
  return value.replace(/\/+$/, '');
}

function asNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function pct(num, den) {
  if (!den) return 'not available';
  return `${((num / den) * 100).toFixed(1)}%`;
}

function fmtNum(value) {
  return new Intl.NumberFormat('en-US').format(value || 0);
}

function safeDate(value) {
  const d = value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
}

function eventDate(event) {
  const d = safeDate(event.created_at);
  return d ? d.toISOString().slice(0, 10) : 'unknown';
}

function uniqueCount(events, field) {
  return new Set(events.map(e => e[field]).filter(Boolean)).size;
}

function countBy(events, getKey) {
  const counts = new Map();
  for (const event of events) {
    const key = getKey(event);
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
}

function sessionsWith(events, eventTypes) {
  const wanted = new Set(eventTypes);
  return new Set(events.filter(e => wanted.has(e.event_type)).map(e => e.session_id).filter(Boolean));
}

function visitorsWith(events, eventTypes) {
  const wanted = new Set(eventTypes);
  return new Set(events.filter(e => wanted.has(e.event_type)).map(e => e.visitor_id).filter(Boolean));
}

function intersectionSize(a, b) {
  let count = 0;
  for (const item of a) if (b.has(item)) count += 1;
  return count;
}

function topList(rows, limit = 10) {
  return rows.slice(0, limit).map(([label, count]) => ({ label, count }));
}

function movieLabel(event) {
  return event.movie || event.movie_ar || event.movie_id || 'unknown';
}

function movieKey(event) {
  const title = movieLabel(event);
  const id = event.movie_id || 'no-id';
  return `${title}|||${id}`;
}

function splitMovieKey(key) {
  const [title, id] = key.split('|||');
  return { title, movie_id: id === 'no-id' ? null : id };
}

function topMovies(events, eventTypes, limit = 20) {
  const wanted = new Set(eventTypes);
  return countBy(events.filter(e => wanted.has(e.event_type)), movieKey)
    .slice(0, limit)
    .map(([key, count]) => ({ ...splitMovieKey(key), count }));
}

function ratingInsights(events) {
  const ratings = events
    .filter(e => e.event_type === 'rating_submitted')
    .map(e => ({ ...e, ratingNumber: asNumber(e.rating) }))
    .filter(e => e.ratingNumber !== null);

  if (!ratings.length) {
    return {
      count: 0,
      average: null,
      distribution: [],
      byMovie: [],
    };
  }

  const average = ratings.reduce((sum, e) => sum + e.ratingNumber, 0) / ratings.length;
  const distribution = countBy(ratings, e => String(e.ratingNumber)).map(([rating, count]) => ({ rating, count }));

  const byMovieGroups = new Map();
  for (const event of ratings) {
    const key = movieKey(event);
    const current = byMovieGroups.get(key) || { total: 0, count: 0 };
    current.total += event.ratingNumber;
    current.count += 1;
    byMovieGroups.set(key, current);
  }

  const byMovie = [...byMovieGroups.entries()]
    .map(([key, value]) => ({
      ...splitMovieKey(key),
      ratings: value.count,
      average: Number((value.total / value.count).toFixed(2)),
    }))
    .sort((a, b) => b.ratings - a.ratings || b.average - a.average)
    .slice(0, 20);

  return {
    count: ratings.length,
    average: Number(average.toFixed(2)),
    distribution,
    byMovie,
  };
}

function searchInsights(events) {
  const searches = events.filter(e => e.event_type === 'search_used');
  const noResults = events.filter(e => e.event_type === 'search_no_results');
  return {
    searches: searches.length,
    noResults: noResults.length,
    noResultRate: pct(noResults.length, searches.length),
    topSearches: topList(countBy(searches, e => e.search_query || 'unknown'), 50),
    topNoResults: topList(countBy(noResults, e => e.search_query || 'unknown'), 50),
  };
}

function filterInsights(events) {
  const filterEvents = events.filter(e => EVENT_GROUPS.filter.includes(e.event_type));
  const topFilters = topList(countBy(filterEvents, e => e.selected_filter || 'unknown'), 30);
  const categories = countBy(filterEvents, (e) => {
    const value = e.selected_filter || '';
    if (value.includes('status:')) return 'status';
    if (value.includes('genre:')) return 'genre';
    if (value.includes('language:')) return 'language';
    if (value.includes('month:')) return 'month';
    if (value.includes('mood:')) return 'mood';
    if (value.includes('picks')) return 'picks';
    if (value === 'all' || value === 'reset') return value;
    return e.event_type || 'unknown';
  }).map(([label, count]) => ({ label, count }));

  return {
    total: filterEvents.length,
    topFilters,
    categories,
  };
}

function privacyCheck(events) {
  const suspiciousFields = new Set();
  const suspiciousSamples = [];
  const piiLike = /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})|(\+?\d[\d\s-]{6,})/i;
  const stringFields = ['movie', 'movie_ar', 'selected_filter', 'search_query', 'city', 'reaction', 'page_path'];

  for (const event of events) {
    for (const field of stringFields) {
      const value = event[field];
      if (typeof value !== 'string' || !value) continue;
      if (piiLike.test(value)) {
        suspiciousFields.add(field);
        if (suspiciousSamples.length < 8) suspiciousSamples.push({ field, value, event_type: event.event_type });
      }
    }
  }

  return {
    hasEmailOrPhoneLikeValues: suspiciousFields.size > 0,
    suspiciousFields: [...suspiciousFields],
    suspiciousSamples,
    notes: [
      'No service role key is needed or used by this report.',
      'Event rows use anonymous visitor_id and session_id values.',
      'Frontend search tracking redacts email/phone-like queries before sending.',
      'The current frontend sends city as null to Supabase; if older rows contain city values, treat them as low-resolution location data.',
    ],
  };
}

async function fetchEvents({ supabaseUrl, anonKey, table, startIso }) {
  const fields = ALL_FIELDS.join(',');
  const baseUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent(table)}`;
  const events = [];
  let offset = 0;

  while (true) {
    const url = new URL(baseUrl);
    url.searchParams.set('select', fields);
    url.searchParams.set('created_at', `gte.${startIso}`);
    url.searchParams.set('order', 'created_at.asc');

    const res = await fetch(url, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        Range: `${offset}-${offset + PAGE_SIZE - 1}`,
        'Range-Unit': 'items',
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Supabase query failed (${res.status}): ${body || res.statusText}`);
    }

    const rows = await res.json();
    if (!Array.isArray(rows)) throw new Error('Supabase returned a non-array response.');
    events.push(...rows);
    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return events;
}

function buildReport(events, { startIso, endIso, table }) {
  const totalEvents = events.length;
  const uniqueVisitors = uniqueCount(events, 'visitor_id');
  const uniqueSessions = uniqueCount(events, 'session_id');
  const sortedDates = events.map(e => safeDate(e.created_at)).filter(Boolean).sort((a, b) => a - b);

  const daily = countBy(events, eventDate).map(([date, count]) => {
    const dayEvents = events.filter(e => eventDate(e) === date);
    return {
      date,
      events: count,
      uniqueVisitors: uniqueCount(dayEvents, 'visitor_id'),
      uniqueSessions: uniqueCount(dayEvents, 'session_id'),
    };
  }).sort((a, b) => a.date.localeCompare(b.date));

  const eventBreakdown = topList(countBy(events, e => e.event_type || 'unknown'), 20);

  const pageViewSessions = sessionsWith(events, EVENT_GROUPS.pageView);
  const movieOpenSessions = sessionsWith(events, EVENT_GROUPS.movieOpen);
  const saveSessions = sessionsWith(events, EVENT_GROUPS.save);
  const watchedSessions = sessionsWith(events, EVENT_GROUPS.watched);
  const ratingSessions = sessionsWith(events, EVENT_GROUPS.rating);
  const searchSessions = sessionsWith(events, EVENT_GROUPS.search);
  const watchlistSessions = sessionsWith(events, EVENT_GROUPS.watchlistOpen);
  const my2026Sessions = sessionsWith(events, EVENT_GROUPS.my2026);

  const movieActionTypes = [
    ...EVENT_GROUPS.movieOpen,
    ...EVENT_GROUPS.save,
    ...EVENT_GROUPS.unsave,
    ...EVENT_GROUPS.watched,
    ...EVENT_GROUPS.unwatched,
    ...EVENT_GROUPS.rating,
    ...EVENT_GROUPS.calendar,
    ...EVENT_GROUPS.share,
  ];
  const activeMovieVisitors = visitorsWith(events, movieActionTypes);

  const visitorEventCounts = countBy(events, e => e.visitor_id || 'unknown').filter(([visitor]) => visitor !== 'unknown');
  const sessionsByVisitor = new Map();
  for (const event of events) {
    if (!event.visitor_id || !event.session_id) continue;
    if (!sessionsByVisitor.has(event.visitor_id)) sessionsByVisitor.set(event.visitor_id, new Set());
    sessionsByVisitor.get(event.visitor_id).add(event.session_id);
  }

  const retention = {
    returningVisitors2PlusSessions: [...sessionsByVisitor.values()].filter(set => set.size >= 2).length,
    visitors3PlusActions: visitorEventCounts.filter(([, count]) => count >= 3).length,
    visitors5PlusActions: visitorEventCounts.filter(([, count]) => count >= 5).length,
    averageEventsPerVisitor: uniqueVisitors ? Number((totalEvents / uniqueVisitors).toFixed(2)) : null,
    averageMovieActionsPerActiveVisitor: activeMovieVisitors.size
      ? Number((events.filter(e => movieActionTypes.includes(e.event_type)).length / activeMovieVisitors.size).toFixed(2))
      : null,
  };

  return {
    meta: {
      table,
      dateRange: { startIso, endIso },
      generatedAt: new Date().toISOString(),
    },
    overview: {
      totalEvents,
      uniqueVisitors,
      uniqueSessions,
      firstEventDate: sortedDates[0]?.toISOString() || null,
      latestEventDate: sortedDates[sortedDates.length - 1]?.toISOString() || null,
    },
    daily,
    eventBreakdown,
    funnel: {
      sessionsWithPageView: pageViewSessions.size,
      sessionsWithMovieOpen: movieOpenSessions.size,
      sessionsWithSave: saveSessions.size,
      sessionsWithWatched: watchedSessions.size,
      sessionsWithRating: ratingSessions.size,
      sessionsWithSearch: searchSessions.size,
      sessionsWithWatchlistOpen: watchlistSessions.size,
      sessionsWithMy2026: my2026Sessions.size,
      pageViewToMovieOpen: pct(movieOpenSessions.size, pageViewSessions.size),
      movieOpenToSave: pct(saveSessions.size, movieOpenSessions.size),
      movieOpenToWatched: pct(watchedSessions.size, movieOpenSessions.size),
      watchedToRating: pct(ratingSessions.size, watchedSessions.size),
      pageViewToSearch: pct(searchSessions.size, pageViewSessions.size),
      pageViewToMy2026: pct(my2026Sessions.size, pageViewSessions.size),
      watchlistOpenToMy2026: pct(intersectionSize(watchlistSessions, my2026Sessions), watchlistSessions.size),
    },
    movies: {
      mostOpened: topMovies(events, EVENT_GROUPS.movieOpen),
      mostSaved: topMovies(events, EVENT_GROUPS.save),
      mostWatched: topMovies(events, EVENT_GROUPS.watched),
      mostRated: topMovies(events, EVENT_GROUPS.rating),
      calendarOrReminder: topMovies(events, EVENT_GROUPS.calendar),
      shares: topMovies(events, EVENT_GROUPS.share),
    },
    ratings: ratingInsights(events),
    search: searchInsights(events),
    filters: filterInsights(events),
    my2026: {
      events: topList(countBy(events.filter(e => EVENT_GROUPS.my2026.includes(e.event_type)), e => e.event_type || 'unknown'), 20),
      note: 'If this is empty, My 2026 events are not currently mapped into Supabase.',
    },
    retention,
    privacy: privacyCheck(events),
  };
}

function printRows(rows, formatter, empty = 'not available') {
  if (!rows || rows.length === 0) {
    console.log(`  ${empty}`);
    return;
  }
  rows.forEach((row, index) => console.log(formatter(row, index)));
}

function printReport(report) {
  const { overview, funnel, movies, ratings, search, filters, my2026, retention, privacy } = report;
  console.log('\nCINEMAP ANALYTICS REPORT');
  console.log(`Date range: ${report.meta.dateRange.startIso} → ${report.meta.dateRange.endIso}`);
  console.log(`Table: ${report.meta.table}`);
  console.log(`Total events: ${fmtNum(overview.totalEvents)}`);
  console.log(`Unique visitors: ${fmtNum(overview.uniqueVisitors)}`);
  console.log(`Unique sessions: ${fmtNum(overview.uniqueSessions)}`);
  console.log(`First event: ${overview.firstEventDate || 'not available'}`);
  console.log(`Latest event: ${overview.latestEventDate || 'not available'}`);

  console.log('\nDAILY TRAFFIC');
  printRows(report.daily, row => `  ${row.date}: ${fmtNum(row.events)} events · ${fmtNum(row.uniqueVisitors)} visitors · ${fmtNum(row.uniqueSessions)} sessions`);

  console.log('\nTOP EVENTS');
  printRows(report.eventBreakdown, row => `  ${row.label}: ${fmtNum(row.count)}`);

  console.log('\nFUNNEL');
  console.log(`  page_view sessions: ${fmtNum(funnel.sessionsWithPageView)}`);
  console.log(`  movie_open sessions: ${fmtNum(funnel.sessionsWithMovieOpen)} (${funnel.pageViewToMovieOpen} of page_view)`);
  console.log(`  save_movie sessions: ${fmtNum(funnel.sessionsWithSave)} (${funnel.movieOpenToSave} of movie_open)`);
  console.log(`  watched_movie sessions: ${fmtNum(funnel.sessionsWithWatched)} (${funnel.movieOpenToWatched} of movie_open)`);
  console.log(`  rating_submitted sessions: ${fmtNum(funnel.sessionsWithRating)} (${funnel.watchedToRating} of watched)`);
  console.log(`  search_used sessions: ${fmtNum(funnel.sessionsWithSearch)} (${funnel.pageViewToSearch} of page_view)`);
  console.log(`  My 2026 sessions: ${fmtNum(funnel.sessionsWithMy2026)} (${funnel.pageViewToMy2026} of page_view)`);

  console.log('\nTOP MOVIES');
  const movieLine = row => `  ${row.title} ${row.movie_id ? `(${row.movie_id})` : ''}: ${fmtNum(row.count)}`;
  console.log('  Opens:');
  printRows(movies.mostOpened.slice(0, 10), movieLine);
  console.log('  Saves:');
  printRows(movies.mostSaved.slice(0, 10), movieLine);
  console.log('  Watched:');
  printRows(movies.mostWatched.slice(0, 10), movieLine);
  console.log('  Ratings:');
  printRows(movies.mostRated.slice(0, 10), movieLine);

  console.log('\nRATING INSIGHTS');
  console.log(`  Ratings submitted: ${fmtNum(ratings.count)}`);
  console.log(`  Average rating: ${ratings.average === null ? 'not available' : ratings.average}`);
  console.log('  Distribution:');
  printRows(ratings.distribution, row => `    ${row.rating}: ${fmtNum(row.count)}`);
  console.log('  Top rated movies:');
  printRows(ratings.byMovie.slice(0, 10), row => `    ${row.title}: ${row.average}/5 from ${fmtNum(row.ratings)} ratings`);

  console.log('\nSEARCH INSIGHTS');
  console.log(`  Searches: ${fmtNum(search.searches)}`);
  console.log(`  No-result searches: ${fmtNum(search.noResults)} (${search.noResultRate})`);
  console.log('  Top searches:');
  printRows(search.topSearches.slice(0, 15), row => `    ${row.label}: ${fmtNum(row.count)}`);
  console.log('  Top no-result searches:');
  printRows(search.topNoResults.slice(0, 15), row => `    ${row.label}: ${fmtNum(row.count)}`);

  console.log('\nFILTER INSIGHTS');
  console.log(`  Filter events: ${fmtNum(filters.total)}`);
  console.log('  Top filters:');
  printRows(filters.topFilters.slice(0, 15), row => `    ${row.label}: ${fmtNum(row.count)}`);
  console.log('  Filter categories:');
  printRows(filters.categories, row => `    ${row.label}: ${fmtNum(row.count)}`);

  console.log('\nMY 2026 INSIGHTS');
  printRows(my2026.events, row => `  ${row.label}: ${fmtNum(row.count)}`);
  if (!my2026.events.length) console.log(`  Note: ${my2026.note}`);

  console.log('\nRETENTION PROXY');
  console.log(`  Visitors with 2+ sessions: ${fmtNum(retention.returningVisitors2PlusSessions)}`);
  console.log(`  Visitors with 3+ actions: ${fmtNum(retention.visitors3PlusActions)}`);
  console.log(`  Visitors with 5+ actions: ${fmtNum(retention.visitors5PlusActions)}`);
  console.log(`  Avg events per visitor: ${retention.averageEventsPerVisitor ?? 'not available'}`);
  console.log(`  Avg movie actions per active visitor: ${retention.averageMovieActionsPerActiveVisitor ?? 'not available'}`);

  console.log('\nPRIVACY CHECK');
  console.log(`  Email/phone-like values found: ${privacy.hasEmailOrPhoneLikeValues ? 'yes' : 'no'}`);
  if (privacy.suspiciousFields.length) console.log(`  Suspicious fields: ${privacy.suspiciousFields.join(', ')}`);
  privacy.notes.forEach(note => console.log(`  - ${note}`));
}

async function main() {
  if (typeof fetch !== 'function') {
    throw new Error('This script needs Node 18+ with global fetch.');
  }

  const supabaseUrl = requireEnv('SUPABASE_URL');
  const anonKey = requireEnv('SUPABASE_ANON_KEY');
  const table = process.env.CINEMAP_ANALYTICS_TABLE || DEFAULT_TABLE;
  const days = Number(process.env.DAYS || argValue('--days') || DEFAULT_DAYS);
  const jsonPath = argValue('--json');
  const endIso = new Date().toISOString();
  const startIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const events = await fetchEvents({ supabaseUrl, anonKey, table, startIso });
  const report = buildReport(events, { startIso, endIso, table });
  printReport(report);

  if (jsonPath) {
    const fullPath = path.resolve(jsonPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, `${JSON.stringify(report, null, 2)}\n`);
    console.log(`\nJSON report written to ${fullPath}`);
  }
}

main().catch((err) => {
  console.error(`\nAnalytics report failed: ${err.message}`);
  process.exit(1);
});
