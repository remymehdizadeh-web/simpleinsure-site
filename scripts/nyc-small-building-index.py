#!/usr/bin/env python3
"""Rebuild two public-data snapshots used on the NYC landlord statistics page.

1. The 2026 SimpleINSURE NYC Small Building Index, from NYC Department of
   City Planning PLUTO on NYC Open Data (resource 64uk-42ks).
2. National Flood Insurance Program contracts in force for the City of New
   York (community 360497) on the OpenFEMA file as-of date, from
   NfipPolicies v3.

The script only writes aggregate rows. It does not save policy records.

Run from the repository root:

    python3 scripts/nyc-small-building-index.py
"""

from __future__ import annotations

import csv
import json
import time
import urllib.parse
import urllib.request
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"

PLUTO = "https://data.cityofnewyork.us/resource/64uk-42ks.json"
PLUTO_META = "https://data.cityofnewyork.us/api/views/64uk-42ks.json"
# Condo unit lots are 1001-6999. Ordinary lots and condo billing lots stay.
LOT_OK = "(lot < 1001 OR lot > 6999)"
SMALL_WHERE = f"unitsres between 1 and 4 AND numbldgs = 1 AND {LOT_OK}"
RESIDENTIAL_WHERE = f"unitsres >= 1 AND numbldgs = 1 AND {LOT_OK}"

NFIP = "https://www.fema.gov/api/open/v3/NfipPolicies"
NFIP_COMMUNITY = "360497"
# The file's asOfDate when this page was built. The script reads asOfDate
# from a sample record and uses that day as the in-force snapshot.
NFIP_SELECT = (
    "id,policyCount,policyEffectiveDate,policyTerminationDate,"
    "rentalPropertyIndicator,floodZoneCurrent,occupancyType"
)

BOROUGH_NAME = {
    "MN": "Manhattan",
    "BX": "Bronx",
    "BK": "Brooklyn",
    "QN": "Queens",
    "SI": "Staten Island",
}
BOROUGH_ORDER = ["MN", "BX", "BK", "QN", "SI"]

UA = "SimpleINSURE-research/1.0 (nyc-small-building-index)"


def get_json(url: str, timeout: int = 180) -> dict | list:
    req = urllib.request.Request(
        url, headers={"User-Agent": UA, "Accept": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return json.load(response)


def pluto(params: dict) -> list:
    url = PLUTO + "?" + urllib.parse.urlencode(params)
    data = get_json(url)
    if not isinstance(data, list):
        raise SystemExit(f"Unexpected PLUTO response: {data!r}"[:300])
    return data


def one_decimal(numerator: int, denominator: int) -> str:
    """Percent to one decimal, half up."""
    if denominator == 0:
        return ""
    scaled = (numerator * 1000 + denominator // 2) // denominator
    whole, frac = divmod(scaled, 10)
    return f"{whole}.{frac}"


def build_pluto_rows() -> list[dict]:
    meta = get_json(PLUTO_META)
    updated = datetime.fromtimestamp(
        int(meta["rowsUpdatedAt"]), timezone.utc
    ).strftime("%Y-%m-%dT%H:%M:%SZ")
    pulled = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    versions = pluto(
        {"$select": "version, count(*) as n", "$group": "version", "$limit": "20"}
    )
    by_units = pluto(
        {
            "$select": "borough, unitsres, count(*) as tax_lots",
            "$where": SMALL_WHERE,
            "$group": "borough, unitsres",
            "$order": "borough, unitsres",
            "$limit": "100",
        }
    )
    small = {
        row["borough"]: int(row["small_lots"])
        for row in pluto(
            {
                "$select": "borough, count(*) as small_lots",
                "$where": SMALL_WHERE,
                "$group": "borough",
                "$limit": "10",
            }
        )
    }
    residential = {
        row["borough"]: int(row["residential_lots"])
        for row in pluto(
            {
                "$select": "borough, count(*) as residential_lots",
                "$where": RESIDENTIAL_WHERE,
                "$group": "borough",
                "$limit": "10",
            }
        )
    }

    rows: list[dict] = []
    rows.append(
        {
            "record_type": "meta",
            "key": "dataset",
            "value": "NYC DCP PLUTO via NYC Open Data 64uk-42ks",
            "notes": "https://data.cityofnewyork.us/City-Government/Primary-Land-Use-Tax-Lot-Output-PLUTO-/64uk-42ks",
        }
    )
    rows.append(
        {
            "record_type": "meta",
            "key": "pulled_utc",
            "value": pulled,
            "notes": "Time this script requested the file",
        }
    )
    rows.append(
        {
            "record_type": "meta",
            "key": "open_data_rows_updated_utc",
            "value": updated,
            "notes": "rowsUpdatedAt on the Socrata view",
        }
    )
    for item in versions:
        rows.append(
            {
                "record_type": "meta",
                "key": "version_row_count",
                "value": item["n"],
                "notes": item["version"],
            }
        )
    rows.append(
        {
            "record_type": "meta",
            "key": "small_filter",
            "value": SMALL_WHERE,
            "notes": "Index lots",
        }
    )
    rows.append(
        {
            "record_type": "meta",
            "key": "residential_filter",
            "value": RESIDENTIAL_WHERE,
            "notes": "Denominator for the share",
        }
    )

    city_small = 0
    city_residential = 0
    for code in BOROUGH_ORDER:
        boro_small = small[code]
        boro_residential = residential[code]
        city_small += boro_small
        city_residential += boro_residential
        rows.append(
            {
                "record_type": "borough_summary",
                "key": code,
                "value": str(boro_small),
                "notes": (
                    f"{BOROUGH_NAME[code]}; residential_one_building_lots="
                    f"{boro_residential}; share_pct="
                    f"{one_decimal(boro_small, boro_residential)}"
                ),
            }
        )
    by_unit_city: dict[str, int] = {}
    for item in by_units:
        rows.append(
            {
                "record_type": "by_units",
                "key": f"{item['borough']}:{item['unitsres']}",
                "value": item["tax_lots"],
                "notes": BOROUGH_NAME[item["borough"]],
            }
        )
        by_unit_city[item["unitsres"]] = by_unit_city.get(item["unitsres"], 0) + int(
            item["tax_lots"]
        )
    for units in ("1", "2", "3", "4"):
        rows.append(
            {
                "record_type": "citywide_by_units",
                "key": units,
                "value": str(by_unit_city.get(units, 0)),
                "notes": "Sum of the by_units rows for this residential unit count",
            }
        )
    rows.append(
        {
            "record_type": "citywide",
            "key": "small_lots",
            "value": str(city_small),
            "notes": f"share_of_residential_one_building_lots_pct={one_decimal(city_small, city_residential)}",
        }
    )
    rows.append(
        {
            "record_type": "citywide",
            "key": "residential_one_building_lots",
            "value": str(city_residential),
            "notes": "Denominator",
        }
    )
    return rows


def parse_nfip_time(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def sfha(zone: str | None) -> bool:
    text = (zone or "").upper()
    return text.startswith("A") or text.startswith("V")


def build_nfip_rows() -> list[dict]:
    sample = get_json(
        NFIP
        + "?"
        + urllib.parse.urlencode(
            {
                "$top": "1",
                "$select": "asOfDate,nfipCommunityName",
                "$filter": f"nfipCommunityNumberCurrent eq '{NFIP_COMMUNITY}'",
            }
        )
    )
    record = sample["NfipPolicies"][0]
    as_of_raw = record["asOfDate"]
    as_of = parse_nfip_time(as_of_raw)
    window_start = as_of.replace(year=as_of.year - 1)
    window_start_raw = window_start.strftime("%Y-%m-%dT%H:%M:%S.000Z")

    older_filter = (
        f"nfipCommunityNumberCurrent eq '{NFIP_COMMUNITY}' and "
        f"policyTerminationDate gt '{as_of_raw}' and "
        f"policyEffectiveDate lt '{window_start_raw}'"
    )
    older = get_json(
        NFIP
        + "?"
        + urllib.parse.urlencode(
            {
                "$top": "1",
                "$inlinecount": "allpages",
                "$select": "id",
                "$filter": older_filter,
            }
        ),
        timeout=180,
    )
    older_open = int(older["metadata"].get("count") or 0)

    recent_filter = (
        f"nfipCommunityNumberCurrent eq '{NFIP_COMMUNITY}' and "
        f"policyEffectiveDate ge '{window_start_raw}'"
    )
    seen: dict[str, dict] = {}
    skip = 0
    while True:
        batch = None
        last_error: Exception | None = None
        for attempt in range(5):
            try:
                payload = get_json(
                    NFIP
                    + "?"
                    + urllib.parse.urlencode(
                        {
                            "$filter": recent_filter,
                            "$select": NFIP_SELECT,
                            "$top": "1000",
                            "$skip": str(skip),
                        }
                    ),
                    timeout=120,
                )
                batch = payload["NfipPolicies"]
                break
            except Exception as error:  # noqa: BLE001 - retry transient OpenFEMA 503s
                last_error = error
                time.sleep(4 * (attempt + 1))
        if batch is None:
            raise SystemExit(f"OpenFEMA failed at skip {skip}: {last_error}")
        if not batch:
            break
        for item in batch:
            seen.setdefault(item["id"], item)
        if len(batch) < 1000:
            break
        skip += 1000

    in_force = []
    for item in seen.values():
        effective = parse_nfip_time(item["policyEffectiveDate"])
        termination = parse_nfip_time(item["policyTerminationDate"])
        if effective <= as_of and termination > as_of:
            in_force.append(item)

    def units(items: list[dict]) -> int:
        return sum(int(item["policyCount"] or 0) for item in items)

    occupancy_units: Counter[str] = Counter()
    for item in in_force:
        occupancy_units[str(item.get("occupancyType"))] += int(item["policyCount"] or 0)

    rental_units = units(
        [item for item in in_force if item.get("rentalPropertyIndicator") is True]
    )
    sfha_units = units([item for item in in_force if sfha(item.get("floodZoneCurrent"))])
    blank_zone_units = units(
        [item for item in in_force if not item.get("floodZoneCurrent")]
    )

    notes = (
        "In force means policyEffectiveDate on or before the file as-of date and "
        "policyTerminationDate after that date. Insured units are the sum of "
        "policyCount. A condo association contract can cover more than one unit. "
        f"Contracts with an earlier effective date still open on the as-of date: {older_open}."
    )
    rows = [
        {
            "metric": "community_number",
            "value": NFIP_COMMUNITY,
            "notes": record.get("nfipCommunityName") or "NEW YORK, CITY OF",
        },
        {"metric": "as_of", "value": as_of_raw, "notes": "asOfDate on the OpenFEMA file"},
        {
            "metric": "dataset",
            "value": "OpenFEMA NfipPolicies v3",
            "notes": "https://www.fema.gov/api/open/v3/NfipPolicies",
        },
        {
            "metric": "source_records_with_effective_date_in_prior_year",
            "value": str(len(seen)),
            "notes": recent_filter,
        },
        {
            "metric": "older_contracts_still_open",
            "value": str(older_open),
            "notes": "Should be 0 if the one-year window covers every in-force contract",
        },
        {
            "metric": "contracts_in_force",
            "value": str(len(in_force)),
            "notes": notes,
        },
        {
            "metric": "insured_units_in_force",
            "value": str(units(in_force)),
            "notes": "Sum of policyCount",
        },
        {
            "metric": "rental_flagged_insured_units",
            "value": str(rental_units),
            "notes": "rentalPropertyIndicator is true. Other records are not treated as owner-occupied.",
        },
        {
            "metric": "sfha_zone_insured_units",
            "value": str(sfha_units),
            "notes": "floodZoneCurrent starts with A or V. Blank zones are excluded.",
        },
        {
            "metric": "blank_flood_zone_insured_units",
            "value": str(blank_zone_units),
            "notes": "floodZoneCurrent empty",
        },
    ]
    for code, count in sorted(occupancy_units.items(), key=lambda pair: pair[0]):
        rows.append(
            {
                "metric": f"occupancy_{code}_insured_units",
                "value": str(count),
                "notes": "OpenFEMA occupancyType. 11 single family, 12 is a 2 to 4 unit residential building.",
            }
        )
    return rows


def write_csv(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames: list[str] = []
    for row in rows:
        for key in row:
            if key not in fieldnames:
                fieldnames.append(key)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    pluto_rows = build_pluto_rows()
    pluto_path = DATA / "nyc-small-building-index-2026.csv"
    write_csv(pluto_path, pluto_rows)
    print(f"wrote {pluto_path}")

    nfip_rows = build_nfip_rows()
    nfip_path = DATA / "nyc-nfip-policies-in-force-2026-09-08.csv"
    write_csv(nfip_path, nfip_rows)
    print(f"wrote {nfip_path}")


if __name__ == "__main__":
    main()
