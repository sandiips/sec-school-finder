-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.primaries (
  slug text NOT NULL,
  name text NOT NULL,
  code text,
  CONSTRAINT primaries_pkey PRIMARY KEY (slug)
);
CREATE TABLE public.school_cca_scores (
  school_slug text NOT NULL,
  cca text NOT NULL,
  score double precision NOT NULL,
  year integer NOT NULL DEFAULT 2024,
  CONSTRAINT school_cca_scores_pkey PRIMARY KEY (school_slug, cca)
);
CREATE TABLE public.school_sports_scores (
  school_slug text NOT NULL,
  sport text NOT NULL,
  score double precision NOT NULL,
  year integer NOT NULL DEFAULT 2024,
  CONSTRAINT school_sports_scores_pkey PRIMARY KEY (school_slug, sport)
);
CREATE TABLE public.schools (
  name text NOT NULL,
  code integer UNIQUE,
  address text,
  lat double precision,
  lng double precision,
  cop_ranges jsonb,
  CONSTRAINT schools_pkey PRIMARY KEY (name)
);
CREATE TABLE public.secondary_affiliations (
  primary_name text NOT NULL,
  secondary_code integer NOT NULL,
  primary_slug text,
  CONSTRAINT secondary_affiliations_pkey PRIMARY KEY (primary_name, secondary_code),
  CONSTRAINT secondary_affiliations_secondary_code_fkey FOREIGN KEY (secondary_code) REFERENCES public.schools(code)
);