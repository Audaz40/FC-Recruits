# Database Seed

This script populates the database with sample data for development and testing.

## Usage

```bash
pnpm --filter @workspace/db run seed
```

## What it includes

The seed script creates the following data:

### Clubs (2)
- **Elite FC United** (PS5, Division 1, Competitive, Spain)
- **Sunday League Heroes** (Xbox, Division 5, Casual, UK)

### Players (8)
All players are free agents except where noted:

1. **SpeedDemon99** (Marco Rossi) - ST/CAM, 88 OVR, Italy
2. **WallKeeper_Pro** (Carlos Santos) - GK, 85 OVR, Portugal
3. **PlayMaker_X** (Lukas Mueller) - CAM/CM, 86 OVR, Germany
4. **RockSolid_CB** (James Wilson) - CB/CDM, 84 OVR, England
5. **WingWizard23** (Pierre Dubois) - LW/RW, 83 OVR, France
6. **MidfieldEngine** (Erik Johansson) - CM/CDM, 85 OVR, Sweden
7. **TargetMan_9** (Diego Fernandez) - ST/CF, 87 OVR, Argentina
8. **FullBackExpress** (Tomáš Novák) - RB/LB, 82 OVR, Czech Republic

### Memberships (4)
- SpeedDemon99 → Elite FC United (starter)
- RockSolid_CB → Elite FC United (starter)
- WingWizard23 → Sunday League Heroes (starter)
- FullBackExpress → Sunday League Heroes (substitute)

### Tryouts (2)
- WallKeeper_Pro requested tryout with Elite FC United (pending)
- PlayMaker_X accepted tryout with Sunday League Heroes (scheduled)

### Ratings (1)
- Club rating for PlayMaker_X's tryout (4/5 stars)

### Notifications (2)
- Tryout request notification for WallKeeper_Pro
- Tryout accepted notification for PlayMaker_X

## Notes

- The script clears existing data before seeding
- All data is realistic and suitable for development/testing
- Players have varied positions, ratings, and nationalities
- Clubs have different styles and divisions to test filtering
