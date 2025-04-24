# PrizePicks API

## REST Endpoints

### 1. List Active Leagues

**GET** `/leagues`

- Returns a list of all active leagues.
- Response format:

  ```json
  {
    "leagues": [
      {
        "id": "7",
        "name": "NBA",
        "icon": "basketball",
        "imageUrl": "https://.../26.svg",
        "projectionsCount": 4910
      },
      // ... more leagues
    ]
  }
  ```

### 2. List All Projections

**GET** `/projections?per_page=100&include_new_player_attributes=True`

- `per_page`: Number of projections to fetch (max 100).
- `include_new_player_attributes`: Must be `True` to include player info.

**Sample response**:

```json
{
  "projections": [
    {
      "type": "projection",
      "id": "4614310",
      "attributes": {
        "board_time": "2025-04-01T14:40:00-04:00",
        "opponent": "LAT MAPS 1-3",
        "game_id": "LATCAR45771.5625",
        "line_score": 51,
        "odds_type": "standard",
        "projection_type": "Single Stat",
        "start_time": "2025-04-24T13:30:00-04:00",
        "stat_display_name": "MAPS 1-3 Kills",
        "stat_type": "MAPS 1-3 Kills",
        "status": "pre_game",
        "today": true
      },
      "relationships": {
        "new_player": {
          "type": "new_player",
          "id": "180632",
          "attributes": {
            "combo": false,
            "display_name": "Tim Hardaway Jr.",
            "image_url": "https://...QeaYZHBpY66x9atwRKNMewI9.webp",
            "league": "NBA",
            "league_id": 7,
            "name": "Tim Hardaway Jr.",
            "position": "G-F",
            "team": "DET",
            "team_name": "Pistons",
            "Team": "Detroit"
          }
        }
      }
    }
  ]
}
``` 

### 3. List Projections by League

**GET** `/leagues/:leagueId/projections`

- Replace `:leagueId` with one of the IDs in the table below.
- Response mirrors `/projections` but only for the given league.

---

## Data Attribute Reference

### League Object

| Field             | Type   | Description                          |
| ----------------- | ------ | ------------------------------------ |
| `id`              | string | Unique league identifier             |
| `name`            | string | Full league name                     |
| `icon`            | string | Icon key (font or SVG name)          |
| `imageUrl`        | string | Absolute URL to league icon SVG      |
| `projectionsCount`| number | Count of open projections            |

### Projection Object

| Field                 | Type    | Description                             |
| --------------------- | ------- | --------------------------------------- |
| `type`                | string  | Always `"projection"`                  |
| `id`                  | string  | Unique projection identifier            |
| **attributes**        | object  |                                        |
| `board_time`          | string  | ISO timestamp when projection boards    |
| `opponent`            | string  | Opponent or event description           |
| `game_id`             | string  | Internal game identifier                |
| `line_score`          | number  | Betting line or score threshold         |
| `odds_type`           | string  | Odds format (e.g. `standard`)           |
| `projection_type`     | string  | Category of stat (e.g. `Single Stat`)   |
| `start_time`          | string  | ISO timestamp of event start            |
| `stat_display_name`   | string  | Human-readable stat name                |
| `stat_type`           | string  | Internal stat type name                 |
| `status`              | string  | Current status (`pre_game`, `live`, etc)|
| `today`               | boolean | Is the event today?                     |

| **relationships**    | object  |                                         |
| `new_player`        | object  | Embedded player data                    |

### Player Object (`new_player`)

| Field          | Type      | Description                                |
| -------------- | --------- | ------------------------------------------ |
| `type`         | string    | Always `"new_player"`                    |
| `id`           | string    | Unique player identifier                   |
| **attributes** | object    |                                            |
| `combo`        | boolean   | Part of a combo play?                     |
| `display_name` | string    | Player's display name                     |
| `image_url`    | string    | URL to player headshot                    |
| `league`       | string    | League abbreviation (e.g. `NBA`)          |
| `league_id`    | number    | League numeric ID                         |
| `name`         | string    | Player's full name                        |
| `position`     | string    | Position (e.g. `G-F`)                     |
| `team`         | string    | Team code (e.g. `DET`)                    |
| `team_name`    | string    | Team full name (e.g. `Pistons`)           |
| `Team`         | string    | Renamed from `market`, human-friendly     |

---

## Available League IDs

| League      | ID   |
| ----------- | ---- |
| PGA         | 1    |
| MLB         | 2    |
| WNBA        | 3    |
| NASCAR      | 4    |
| TENNIS      | 5    |
| MLS         | 6    |
| NBA         | 7    |
| NHL         | 8    |
| NFL         | 9    |
| CFL         | 11   |
| MMA         | 12   |
| EPL         | 14   |
| CFB         | 15   |
| RYDER       | 17   |
| CBB         | 20   |
| NFL2H       | 25   |
| AAF         | 27   |
| NIT         | 33   |
| SMITE       | 34   |
| NFL1H       | 35   |
| WWC         | 36   |
| CWS         | 37   |
| BIG3        | 38   |
| COPA        | 39   |
| NBASL       | 40   |
| BOXING      | 42   |
| SEC         | 47   |
| UCL         | 79   |
| NBA2H       | 80   |
| FIRST_HALF  | 81   |
| SOCCER      | 82   |
| PRES        | 83   |
| NBA1H       | 84   |
| XFL         | 117  |
| LOL         | 121  |
| HORSE       | 122  |
| DRAFT       | 123  |
| CSGO        | 124  |
| F1          | 125  |
| NBA2K       | 126  |
| POKER       | 127  |
| GOLF        | 131  |
| ACL         | 132  |
| KBO         | 135  |
| XFINITY     | 137  |
| TRUCKS      | 138  |
| OUTLAW      | 140  |
| CBA         | 142  |
| TBT         | 144  |
| COD         | 145  |
| JAIALAI     | 148  |
| NBA4Q       | 149  |
| CFB2H       | 150  |
| EURO        | 151  |
| NFL4Q       | 152  |
| CFB4Q       | 153  |
| MAC         | 154  |
| CBB2H       | 155  |
| DISCC       | 156  |
| DISC        | 157  |
| NBAG        | 158  |
| VAL         | 159  |
| NBAGS       | 160  |
| RL          | 161  |
| CRICKET     | 162  |
| EUROS       | 164  |
| AFL         | 165  |
| DOTA2       | 174  |
| WEURO       | 175  |
| WCBB        | 176  |

---

> **Tips & Troubleshooting**
> - 429 errors indicate rate limits—retry after a delay.
> - 400 errors usually mean missing parameters.
> - 500 errors are server-side; check logs.

---
