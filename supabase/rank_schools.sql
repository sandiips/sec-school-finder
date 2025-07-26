
with
  -- pull in base results
  base as (
    select *
      from public.search_schools(
        user_score, user_lat, user_lng, user_primary, 1000
      )
  ),
  -- filter by distance
  within_dist as (
    select *
      from base
     where distance_m <= max_distance_km * 1000
  ),
  -- compute slugs and affiliation flag
  with_aff as (
    select
      w.*,
      -- slugify secondary name
      regexp_replace(
        regexp_replace(lower(s.name), '[^a-z0-9\s]', '', 'g'),
        '\s+','-','g'
      ) as slug,
      -- check affiliation by slugified primary_name
      exists (
        select 1
          from public.secondary_affiliations sa
         where sa.secondary_code = w.code
           and regexp_replace(
                 regexp_replace(lower(sa.primary_name), '[^a-z0-9\s]', '', 'g'),
                 '\s+','-','g'
               ) = user_primary
      ) as aff_flag
    from within_dist w
    join public.schools s on s.code = w.code
  ),
  -- allow if COP passes OR is affiliated
  eligible as (
    select *
      from with_aff w
     where w.match_max_score >= user_score
        or w.aff_flag
  ),
  -- fetch normalization maxima
  max_vals as (
    select
      (select max(score) from public.school_sports_scores
         where sport='football' and year=2024)       as max_sport,
      (select max(score) from public.school_cca_scores
         where cca='National Robotics Competition' and year=2024) as max_cca
  )
select
  e.name,
  e.code,
  e.address,
  e.distance_m/1000                                         as distance_km,
  e.posting_group,
  e.aff_flag                                               as is_affiliated,
  e.match_max_score                                        as cop_max_score,
  -- normalized distance
  greatest(0,1 - e.distance_m/(max_distance_km*1000))      as norm_dist,
  -- normalized football
  coalesce(ss.score/max_vals.max_sport,0)                  as norm_sport,
  -- normalized CCA
  coalesce(sc.score/max_vals.max_cca,0)                    as norm_cca,
  -- composite tie-break
  (
    weight_dist  * greatest(0,1 - e.distance_m/(max_distance_km*1000)))
  + weight_sport * coalesce(ss.score/max_vals.max_sport,0)
  + weight_cca   * coalesce(sc.score/max_vals.max_cca,0)
                                                          as composite_score
from eligible e
cross join max_vals
left join public.school_sports_scores ss
  on ss.school_slug = e.slug
 and ss.sport       = 'football'
 and ss.year        = 2024
left join public.school_cca_scores sc
  on sc.school_slug = e.slug
 and sc.cca         = 'National Robotics Competition'
 and sc.year        = 2024
order by
  e.match_max_score asc,
  composite_score desc
limit limit_count;
