# Stage 4 Data Quality Guide (NUIST)

This guide is for **Phase 4: data quality and scene coverage**.

## 0) Seed file note

- `poi_nuist_seed_20260413.sql` may contain encoding artifacts in some environments.
- For a clean demo environment, prefer:
  1) importing your current verified `poi` dataset backup, or
  2) importing the newer seed and then running the stage4 cleanup/check scripts below.

## 1) Run cleanup

Execute:

```sql
SOURCE src/main/resources/sql/poi_stage4_quality_cleanup.sql;
```

What it does:
- normalizes `type`
- fills default `opening_hours` for missing values
- disables invalid coordinates
- disables points outside the NUIST campus bounding box
- keeps a one-time backup snapshot table `poi_backup_stage4`

## 2) Run checks

Execute:

```sql
SOURCE src/main/resources/sql/poi_stage4_quality_checks.sql;
```

Target status:
- enabled POI count remains in **50-80**
- no invalid enabled coordinates
- no enabled points outside campus bounding box
- all major categories are present in `type` stats

## 3) Duplicate handling (manual review)

Use the duplicate query from the checks script.
For each duplicated name:
- keep the best coordinate row enabled
- set other rows to `enabled = 0`

## 4) Recommended core coverage

Ensure enabled points cover:
- teaching buildings / colleges
- canteens
- library
- sports areas
- activity centers
- service centers
- gates / hospital / residential areas

## 5) Regression checks after cleanup

- `GET /api/v1/pois?enabled=true`
- `GET /api/v1/pois/types`
- homepage search by `teaching_building`, `canteen`, `library`, `sports`
- POI detail + marker
- walking route planning still works
