#!/usr/bin/env ruby
# frozen_string_literal: true

# Cinemap catalog validator.
# Static repo, no npm/build step: this script intentionally uses only Ruby's
# standard library and performs a conservative scan of docs/assets/src/utils.js.

require 'date'
require 'set'

ROOT = File.expand_path('..', __dir__)
UTILS = File.join(ROOT, 'docs/assets/src/utils.js')

source = File.read(UTILS)

def extract_array(source, const_name)
  marker = "const #{const_name} = ["
  start = source.index(marker)
  raise "Could not find #{const_name}" unless start

  body_start = source.index('[', start)
  depth = 0
  i = body_start
  while i < source.length
    char = source[i]
    depth += 1 if char == '['
    depth -= 1 if char == ']'
    return [source[(body_start + 1)...i], body_start + 1] if depth.zero?
    i += 1
  end

  raise "Could not parse #{const_name}"
end

def object_entries(array_source, base_offset)
  entries = []
  i = 0
  while i < array_source.length
    if array_source[i] == '{'
      start = i
      depth = 0
      while i < array_source.length
        depth += 1 if array_source[i] == '{'
        depth -= 1 if array_source[i] == '}'
        if depth.zero?
          entries << [array_source[start..i], base_offset + start]
          break
        end
        i += 1
      end
    end
    i += 1
  end
  entries
end

def field(entry, key)
  entry[/\b#{Regexp.escape(key)}:\s*"([^"]*)"/m, 1] ||
    entry[/\b#{Regexp.escape(key)}:\s*'([^']*)'/m, 1]
end

def bool_field?(entry, key)
  !!(entry =~ /\b#{Regexp.escape(key)}:\s*true\b/)
end

def line_for(source, offset)
  source[0...offset].count("\n") + 1
end

arrays = %w[RAW_MOVIES KSA_BOX_OFFICE_IMPORTS]
movies = arrays.flat_map do |name|
  body, offset = extract_array(source, name)
  object_entries(body, offset).map do |entry, entry_offset|
    tmdb_ids = entry.scan(/\btmdbId:\s*(\d+)/).flatten
    {
      group: name,
      line: line_for(source, entry_offset),
      entry: entry,
      en: field(entry, 'en'),
      ar: field(entry, 'ar'),
      date: field(entry, 'date'),
      overview: field(entry, 'overview'),
      overview_en: field(entry, 'overviewEn'),
      local_poster: field(entry, 'localPoster'),
      tmdb_ids: tmdb_ids,
      prefer_local_overview: bool_field?(entry, 'preferLocalOverview'),
      local_poster_required: bool_field?(entry, 'localPosterRequired') || bool_field?(entry, 'requiresLocalPoster')
    }
  end
end

issues = Hash.new { |h, k| h[k] = [] }

movies.each do |movie|
  label = "#{movie[:en] || '(missing English title)'} | #{movie[:date] || '(missing date)'}"

  issues[:missing_tmdb_id] << movie if movie[:tmdb_ids].empty?
  issues[:duplicate_tmdb_id_property] << movie if movie[:tmdb_ids].length > 1
  issues[:missing_arabic_title] << movie if movie[:ar].to_s.strip.empty?

  if movie[:date].to_s !~ /\A\d{4}-\d{2}-\d{2}\z/
    issues[:invalid_or_missing_date] << movie
  else
    begin
      Date.iso8601(movie[:date])
    rescue ArgumentError
      issues[:invalid_or_missing_date] << movie
    end
  end

  if movie[:prefer_local_overview] && movie[:overview].to_s.strip.empty? && movie[:overview_en].to_s.strip.empty?
    issues[:prefer_local_overview_without_text] << movie
  end

  if movie[:local_poster_required] && movie[:local_poster].to_s.strip.empty?
    issues[:missing_required_local_poster] << movie
  end

  movie[:label] = label
end

tmdb_index = Hash.new { |h, k| h[k] = [] }
key_index = Hash.new { |h, k| h[k] = [] }
movies.each do |movie|
  movie[:tmdb_ids].uniq.each { |id| tmdb_index[id] << movie }
  key_index[[movie[:en], movie[:date]]] << movie if movie[:en] && movie[:date]
end

duplicate_tmdb_ids = tmdb_index.select { |_id, rows| rows.length > 1 }
duplicate_movie_keys = key_index.select { |_key, rows| rows.length > 1 }

puts 'Cinemap catalog validation'
puts "File: #{UTILS}"
puts "Movies scanned: #{movies.length}"
puts

{
  missing_tmdb_id: 'Missing tmdbId',
  duplicate_tmdb_id_property: 'Duplicate tmdbId property inside one entry',
  invalid_or_missing_date: 'Invalid or missing release date',
  missing_arabic_title: 'Missing Arabic title',
  prefer_local_overview_without_text: 'preferLocalOverview set without local overview text',
  missing_required_local_poster: 'Missing required local poster'
}.each do |key, title|
  rows = issues[key]
  puts "#{title}: #{rows.length}"
  rows.each do |movie|
    puts "  - line #{movie[:line]}: #{movie[:label]}"
  end
  puts
end

puts "Duplicate tmdbId across movies: #{duplicate_tmdb_ids.length}"
duplicate_tmdb_ids.each do |id, rows|
  puts "  - tmdb:#{id}"
  rows.each { |movie| puts "    line #{movie[:line]}: #{movie[:label]}" }
end
puts

puts "Duplicate movie keys (en|date): #{duplicate_movie_keys.length}"
duplicate_movie_keys.each do |(en, date), rows|
  puts "  - #{en}|#{date}"
  rows.each { |movie| puts "    line #{movie[:line]}: #{movie[:group]}" }
end
puts

if issues.values.all?(&:empty?) && duplicate_tmdb_ids.empty? && duplicate_movie_keys.empty?
  puts 'Result: OK'
else
  puts 'Result: review required'
end
