// ===== [World Pending Deletion] — content: Rival grudges =====
'use strict';
// Phase 7, step 1. Every named rival keeps a record against you (core.js: meta.grudges). A rival who beat you last time
// comes back with one more trait and says so (taunt). Beat a rival twice and they say so (second). Beat them a third time
// and they retire: they stop entering your normal worlds, and leave a trophy and a closing line in the Archive (retire).
// Pending World and practice runs keep the record but never change a fight for it.
//   taunt: they beat you last time.  second: you have beaten them twice.  retire: what they say as they go.
//   trophy: what they leave, as the Archive names it.  (Lines in quotes are theirs; the Masked Entrant's are the System's.)
const GRUDGES = {
  seraphine: { taunt: 'I prayed for you after our last match. It seems to have worked for me.', second: 'Twice now. I am starting to wonder whose side the gods are on.', retire: "Three times. I'll lay the shield down. Pray for my world, would you? Nobody else does.", trophy: "Seraphine's cracked shield" },
  grukk: { taunt: 'Grukk win last time! Grukk tell everyone. Nobody listen.', second: 'Twice you beat Grukk. Grukk get up anyway. Is what Grukk do.', retire: 'Grukk stay down. First time. Feels strange. Take club.', trophy: "Grukk's splintered club" },
  lyss: { taunt: 'You lost to me. Did the water taste odd? It was meant to.', second: "Twice. I'm running out of poisons I haven't tried on you.", retire: 'Fine. Keep the vial. It\'s empty. Mostly.', trophy: "Lyss's last vial" },
  masked: { taunt: '[The Masked Entrant has copied your last defeat. It intends to repeat it.]', second: '[The Masked Entrant\'s record now matches yours. Twice.]', retire: '[The Masked Entrant has withdrawn. The mask remains. Nobody is wearing it.]', trophy: 'An empty mask' },
  kaito: { taunt: "I beat you. I studied why. You'll do it the same way again.", second: "Twice. You've changed. The System hasn't. Remember that.", retire: "Three times, something new each time. I'll stop entering. Tell me if it repeats.", trophy: "Kaito's annotated scroll" },
  calder: { taunt: 'My win last time was filed and witnessed. Shall we add another?', second: 'Two defeats. I have filed a complaint against myself.', retire: 'Three. I withdraw, formally. My sword is yours. Please keep it clean.', trophy: "Ser Calder's dress sword" },
  delphine: { taunt: "I won the last one. I've already spent the winnings.", second: 'Two losses. My bookmaker has stopped answering my letters.', retire: "Three. I'm out. Keep the dice. They've never liked me.", trophy: "Delphine's loaded dice" },
  mott: { taunt: "Sorry about last time. I won. I'm still not sure how.", second: 'Twice. Sorry. I keep making you do this.', retire: "Three times. I think I'll stop now. Sorry for the trouble.", trophy: "Mott's unsent apology" },
  ossian: { taunt: 'I burned you last time. You still smell of it.', second: "Twice you've put me out. I'm running low on matches.", retire: "Three. The fire's out. Keep the tinderbox. I won't need it.", trophy: "Ossian's tinderbox" },
  wren: { taunt: 'Beat you last time. You never saw me go.', second: "Twice. You're getting faster. I hate that.", retire: "Three. Fine. I'm stopping. For a while. Don't tell anyone.", trophy: "Wren's worn-out boots" },
  bram: { taunt: 'Last time I counted to three. You fell at two.', second: "Twice you've beaten me. I lost count.", retire: "Three. The storm's done. I'll stop counting.", trophy: "Bram's storm whistle" },
  sable: { taunt: 'You stayed down last time. People usually do.', second: "Twice you've walked away from me. I'm keeping count.", retire: "Three times. Go on, then. I'll save the coffin for someone else.", trophy: "Mother Sable's coffin nail" },
  vey_twins: { taunt: 'We beat you. We still argue about which of us did.', second: "Twice you've beaten us. We agree on that, at least.", retire: "Three. We're withdrawing. Both of us. The System will count it once.", trophy: "The Vey twins' shared entry card" },
  brook_pair: { taunt: 'Tarn beat you. Vela watched. She wants a turn.', second: "Twice. Tarn's sulking. Vela isn't. Be worried.", retire: "Three times. We'll pay the second fee and go home. If there's a home.", trophy: "The Brooks' one shared badge" },
};
const GRUDGE_RETIRE = 3; // wins against a rival that retire them
