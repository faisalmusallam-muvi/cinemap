#!/usr/bin/env node
/*
 * Cinemap analytics report
 *
 * This script reads aggregate analytics only through the
 * cinemap_analytics_summary RPC. It does not read raw cinemap_events rows.
 *
 * Install the RPC first:
 *   Run docs/sql/cinemap_analytics_summary.sql in Supabase SQL Editor.
 *
 * Run locally with anon/publishable credentials only:
 *
 *   SUPABASE_URL="https://<project-ref>.supabase.co" \
 *   SUPABASE_ANON_KEY="<anon-or-publishable-key>" \
 *   DAYS=7 \
 *   node tools/cinemap-analytics-report.js
 *
 * Optional:
 *   node tools/cinemap-analytics-report.js --json reports/analytics-7d.json
 *
 * Do not put real keys in this file. Generated reports should stay local.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_DAYS = 30;
const RPC_NAME = 'cinemap_analytics_summary';

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

function fmtNum(value) {
  return new Intl.NumberFormat('en-US').format(Number(value || 0));
}

function pct(num, den) {
  const n = Number(num || 0);
  const d = Number(den || 0);
  if (!d) return 'not available';
  return `${((n / d) * 100).toFixed(1)}%`;
}

function writeJsonIfRequested(report) {
  const jsonPath = argValue('--json');
  if (!jsonPath) return;
  const fullPath = path.resolve(jsonPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`\nJSON report written to ${fullPath}`);
}

async function callAnalyticsRpc({ supabaseUrl, anonKey, days }) {
  const endpoint = `${supabaseUrl}/rest/v1/rpc/${RPC_NAME}`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ days_back: days }),
  });

  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }

  if (!res.ok) {
    const detail = typeof body === 'string' ? body : (body?.message || body?.hint || JSON.stringify(body));
    throw new Error(
      `Analytics RPC not installed or not accessible. Run docs/sql/cinemap_analytics_summary.sql in Supabase SQL Editor. ` +
      `Supabase returned ${res.status}: ${detail}`
    );
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('Analytics RPC returned an unexpected response shape.');
  }

  return body;
}

function listRows(rows, formatter, empty = 'not available') {
  if (!Array.isArray(rows) || rows.length === 0) {
    console.log(`  ${empty}`);
    return;
  }
  rows.forEach((row, index) => console.log(formatter(row, index)));
}

function byEvent(rows, eventType, limit = 10) {
  return (rows || []).filter(row => row.event_type === eventType).slice(0, limit);
}

function printReport(report) {
  const overview = report.overview || {};
  const funnel = report.funnel || {};
  const ratings = report.rating_insights || {};
  const ratingOverview = ratings.overview || {};
  const search = report.search_insights || {};
  const searchOverview = search.overview || {};
  const privacy = report.privacy || {};

  console.log('\nCINEMAP ANALYTICS REPORT');
  console.log(`Source: ${report.meta?.source || RPC_NAME}`);
  console.log(`Days back: ${report.meta?.days_back ?? 'not available'}`);
  console.log(`Generated at: ${report.meta?.generated_at || 'not available'}`);
  console.log(`Total events: ${fmtNum(overview.total_events)}`);
  console.log(`Unique visitors: ${fmtNum(overview.unique_visitors)}`);
  console.log(`Unique sessions: ${fmtNum(overview.unique_sessions)}`);
  console.log(`First event: ${overview.first_event_at || 'not available'}`);
  console.log(`Latest event: ${overview.latest_event_at || 'not available'}`);

  console.log('\nDAILY TRAFFIC');
  listRows(report.daily_traffic, row => (
    `  ${row.date}: ${fmtNum(row.total_events)} events · ${fmtNum(row.unique_visitors)} visitors · ${fmtNum(row.unique_sessions)} sessions`
  ));

  console.log('\nTOP EVENTS');
  listRows(report.event_breakdown, row => `  ${row.event_type}: ${fmtNum(row.event_count)}`);

  console.log('\nFUNNEL');
  console.log(`  page_view sessions: ${fmtNum(funnel.page_view_sessions)}`);
  console.log(`  movie_open sessions: ${fmtNum(funnel.movie_open_sessions)} (${pct(funnel.movie_open_sessions, funnel.page_view_sessions)} of page_view)`);
  console.log(`  save_movie sessions: ${fmtNum(funnel.save_movie_sessions)} (${pct(funnel.save_movie_sessions, funnel.movie_open_sessions)} of movie_open)`);
  console.log(`  watched_movie sessions: ${fmtNum(funnel.watched_movie_sessions)} (${pct(funnel.watched_movie_sessions, funnel.movie_open_sessions)} of movie_open)`);
  console.log(`  rating_submitted sessions: ${fmtNum(funnel.rating_submitted_sessions)} (${pct(funnel.rating_submitted_sessions, funnel.watched_movie_sessions)} of watched)`);
  console.log(`  search_used sessions: ${fmtNum(funnel.search_used_sessions)} (${pct(funnel.search_used_sessions, funnel.page_view_sessions)} of page_view)`);
  console.log(`  watchlist_open sessions: ${fmtNum(funnel.watchlist_open_sessions)}`);
  console.log(`  My 2026 sessions: ${fmtNum(funnel.my2026_sessions)} (${pct(funnel.my2026_sessions, funnel.page_view_sessions)} of page_view)`);

  const movieLine = row => (
    `    ${row.movie || row.movie_ar || 'unknown'}${row.movie_ar ? ` / ${row.movie_ar}` : ''}${row.release_date ? ` (${row.release_date})` : ''}: ${fmtNum(row.count)}`
  );
  console.log('\nTOP MOVIES');
  console.log('  Opens:');
  listRows(byEvent(report.top_movies, 'movie_open'), movieLine);
  console.log('  Saves:');
  listRows(byEvent(report.top_movies, 'save_movie'), movieLine);
  console.log('  Watched:');
  listRows(byEvent(report.top_movies, 'watched_movie'), movieLine);
  console.log('  Ratings:');
  listRows(byEvent(report.top_movies, 'rating_submitted'), movieLine);
  console.log('  Calendar/reminder:');
  listRows(byEvent(report.top_movies, 'calendar_click'), movieLine);
  console.log('  Shares:');
  listRows(byEvent(report.top_movies, 'share_movie'), movieLine);

  console.log('\nRATING INSIGHTS');
  console.log(`  Ratings submitted: ${fmtNum(ratingOverview.total_ratings)}`);
  console.log(`  Average rating: ${ratingOverview.average_rating ?? 'not available'}`);
  console.log('  Distribution:');
  listRows(ratings.distribution, row => `    ${row.rating}: ${fmtNum(row.count)}`);
  console.log('  Average by movie:');
  listRows((ratings.by_movie || []).slice(0, 15), row => (
    `    ${row.movie || row.movie_ar || 'unknown'}: ${row.average_rating ?? 'n/a'}/5 from ${fmtNum(row.rating_count)} ratings`
  ));

  console.log('\nSEARCH INSIGHTS');
  console.log(`  Searches: ${fmtNum(searchOverview.total_searches)}`);
  console.log(`  No-result searches: ${fmtNum(searchOverview.total_no_result_searches)}`);
  console.log(`  Search query privacy threshold: ${searchOverview.privacy_threshold || 3}+ occurrences`);
  console.log('  Top searches:');
  listRows(search.top_searches, row => `    ${row.query}: ${fmtNum(row.count)}`);
  console.log('  Top no-result searches:');
  listRows(search.top_no_result_searches, row => `    ${row.query}: ${fmtNum(row.count)}`);

  console.log('\nFILTER INSIGHTS');
  listRows(report.filter_insights, row => `  ${row.selected_filter}: ${fmtNum(row.count)}`);

  console.log('\nMY 2026 INSIGHTS');
  listRows(report.my2026_insights, row => `  ${row.event_type}: ${fmtNum(row.count)}`);

  const retention = report.retention_proxy || {};
  console.log('\nRETENTION PROXY');
  console.log(`  Visitors with 2+ sessions: ${fmtNum(retention.visitors_with_2_plus_sessions)}`);
  console.log(`  Visitors with 3+ events: ${fmtNum(retention.visitors_with_3_plus_events)}`);
  console.log(`  Visitors with 5+ events: ${fmtNum(retention.visitors_with_5_plus_events)}`);
  console.log(`  Avg events per visitor: ${retention.average_events_per_visitor ?? 'not available'}`);

  console.log('\nPRIVACY CHECK');
  console.log(`  Raw rows exposed: ${privacy.raw_rows_exposed === false ? 'no' : 'check RPC'}`);
  console.log(`  visitor_id exposed: ${privacy.visitor_id_exposed === false ? 'no' : 'check RPC'}`);
  console.log(`  session_id exposed: ${privacy.session_id_exposed === false ? 'no' : 'check RPC'}`);
  console.log(`  reaction exposed: ${privacy.reaction_exposed === false ? 'no' : 'check RPC'}`);
  console.log(`  Search min count: ${privacy.search_min_count || 3}`);
}

async function main() {
  if (typeof fetch !== 'function') {
    throw new Error('This script needs Node 18+ with global fetch.');
  }

  const supabaseUrl = requireEnv('SUPABASE_URL');
  const anonKey = requireEnv('SUPABASE_ANON_KEY');
  const days = Number(process.env.DAYS || argValue('--days') || DEFAULT_DAYS);

  const report = await callAnalyticsRpc({ supabaseUrl, anonKey, days });
  printReport(report);
  writeJsonIfRequested(report);
}

main().catch((err) => {
  console.error(`\nAnalytics report failed: ${err.message}`);
  process.exit(1);
});
