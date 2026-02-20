# Search Gold Set (Lisan al-Arab)

## Goal

Create a 50-100 query evaluation set to track search quality before each monthly release.

## Ownership

- Maintainer curates candidate queries.
- Domain reviewer validates expected matches.

## Template

Each row should include:

- `query_text`
- `normalized_query_text`
- `expected_passage_ids[]`
- `notes`
- `reviewer`
- `validated_at`

## Acceptance Targets (v1)

- Precision@10 >= 0.80
- Recall@20 >= 0.75
- Zero citation-chain failures in sampled expected passages
