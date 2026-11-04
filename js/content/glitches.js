// ===== [World Pending Deletion] — content: Known Issues =====
// The Tournament Archive's log of glitches. The first time an Entrant meets each one (filed after the fight it turns up
// in), the System logs it here and pays a Bug Bounty (BUG_BOUNTY Echoes in core.js; none in Pending World).
//   of: what it is: prefix, gear, skill, event, trait or mod (its name comes from that content), or other (give name).
//   id: that content's id (for of: other, the issue's own key).
//   text: the System's log line. Glitches stay unexplained: say what was observed, never why.
// Order is the order the Archive lists them in.
'use strict';
const KNOWN_ISSUES = [
  { of: 'prefix', id: 'duplicated', text: 'Skill executes twice. Cooldown accounting does not agree.' },
  { of: 'prefix', id: 'unbound', text: 'Cooldown missing. A different skill is paying for it.' },
  { of: 'prefix', id: 'misfiled', text: 'Skill filed under three classes. Two of them deny it.' },
  { of: 'prefix', id: 'overflow', text: 'Damage persists after the fight it was dealt in.' },
  { of: 'prefix', id: 'null', text: 'Damage value reads zero. Opponents break anyway.' },
  { of: 'prefix', id: 'redacted', text: 'Prefix withheld from the Entrant. Withheld from this log as well.' },
  { of: 'prefix', id: 'overclocked', text: 'Output above rated limits. No limit was found.' },
  { of: 'other', id: 'corrupt', name: 'Corrupt', text: 'An Enchanter is selling corruption. The Enchanter has not been located.' },
  { of: 'gear', id: 'missingno', text: 'Item has no fixed properties. It reports a different item each fight.' },
  { of: 'other', id: 'spliced', name: 'Spliced gear', text: 'Two items occupying one record. Neither will leave.' },
  { of: 'other', id: 'unstable', name: 'Unstable skills', text: 'Skill alternates between two definitions. Both are correct.' },
  { of: 'skill', id: 'error_skill', text: 'Skill re-runs the previous command. Its own command was never found.' },
  { of: 'skill', id: 'stack_overflow', text: 'Recursion depth exceeded. The caster is the one who stops.' },
  { of: 'event', id: 'item_duplication', text: 'Inventory desync reported in the Undercity.' },
  { of: 'other', id: 'phantom', name: 'Phantom gear', text: 'Equipped item occupies no slot. Hotfix scheduled.' },
  { of: 'event', id: 'option_not_found', text: 'Event loaded without content. Entrants chose anyway.' },
  { of: 'event', id: 'deja_vu', text: 'Event replayed for one Entrant only.' },
  { of: 'event', id: 'out_of_bounds', text: 'Arena geometry incomplete. An Entrant went outside it.' },
  { of: 'event', id: 'patch_window', text: 'Maintenance window opened without a schedule.' },
  { of: 'trait', id: 'replicated', text: 'Opponent record restored after deletion.' },
  { of: 'trait', id: 'desynced', text: 'Opponent acting on two clocks.' },
  { of: 'trait', id: 'corrupted', text: 'Opponent data altered. Its damage figures are not its own.' },
  { of: 'trait', id: 'clipping', text: 'Opponent hitbox inconsistent with opponent.' },
  { of: 'mod', id: 'corrupted', text: 'World loaded from a damaged save. The world has not noticed.' },
];
