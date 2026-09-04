// Original sample college application essays written for this app, in the style of common
// personal-statement themes (research, service, resilience, community-building), but original
// narratives and prose rather than reproducing any real applicant's or third-party site's
// copyrighted essay text.

export const SAMPLE_ESSAYS = [
  {
    id: 'essay-1',
    university: 'Harvard University',
    topic: 'A marine biology research internship studying coral bleaching',
    theme: 'Discovering scientific curiosity through patient, unglamorous fieldwork',
    text: [
      "The first thing I learned about marine research is that it is mostly waiting. My summer internship at a coastal research station involved diving to the same six coral transects every morning, photographing them from the same angles, and logging the same measurements — color, coverage, the faint white edges creeping across a staghorn colony that had looked fine the week before.",
      "I had pictured research as discovery: a moment where the data reveals something and you understand the ocean a little better than you did an hour ago. Mostly it was spreadsheets. I spent more hours cross-checking photo IDs against a coral catalog than I spent underwater, and for the first two weeks I wondered if I had picked the wrong kind of science.",
      "What changed my mind was a single transect — number four — that I had photographed eleven times by the end of July. Looking at the sequence side by side, I could see the bleaching front move across the reef in a way no single dive would have shown me. It wasn't a discovery anyone would publish. It was just proof that the boring, repetitive part was the actual work, and that patience was not separate from curiosity but the shape curiosity takes when the timescale is longer than a person.",
      "I started asking my supervisor different questions after that — not \"what did we find\" but \"what would we need to keep measuring to know if this reef recovers.\" She let me help design a lighter-weight survey method using a waterproof slate and a fixed quadrat, something the station's volunteers could keep running after I left. It didn't fix anything. It just meant transect four would keep being measured.",
      "I came into that summer expecting to fall in love with the ocean. I left having fallen for something more specific: the discipline of showing up to look at the same six-foot patch of reef, over and over, until the pattern in the noise finally says something. That's the kind of scientist I want to become — one who is comfortable in the unglamorous middle of a long dataset, because that's usually where the real answer is hiding.",
    ],
  },
  {
    id: 'essay-2',
    university: 'Duke University',
    topic: 'Volunteering at a hospice care center',
    theme: 'Redefining usefulness as presence rather than fixing',
    text: [
      "My first shift at the hospice, a nurse handed me a deck of cards and told me to go sit with Mr. Alvarez in room 4. I asked what I was supposed to do for him. She said, \"Nothing. Just be there.\" I had signed up expecting to be useful — reading charts, running errands, something with a visible outcome. Instead I sat across from a man who mostly slept, and when he woke, wanted to talk about his daughter's wedding thirty years earlier.",
      "I am, by nature, a fixer. In debate club I hunt for the counterargument that ends the round. In my family I'm the one who reorganizes the pantry when things feel out of control. Hospice work offered nothing to fix. There is no argument that changes the prognosis, no system to reorganize that changes how much time someone has left.",
      "It took me weeks to stop treating silence as a failure. Mr. Alvarez didn't need me to say something wise or comforting. He needed someone to not look away when he talked about being scared, and to not rush him toward a more comfortable topic. The volunteers who had been there longer than me were good at this in a way I initially mistook for passivity — they weren't doing less, they were doing something I didn't have a name for yet.",
      "By my third month, I stopped bringing an agenda to my shifts. I brought a deck of cards because Mr. Alvarez liked gin rummy, not because I needed an activity to justify being in the room. When he passed in October, his daughter thanked the volunteers by name, mine included, for what she called \"just sitting with him.\" I realized that was the whole job, and that it was harder than any fix I'd ever engineered.",
      "I still don't think I'm naturally good at stillness. But hospice taught me that usefulness isn't always a verb — sometimes it's just staying in the room. I carry that into every version of care I try to offer now, whether it's a friend going through something I can't solve or a problem set I can't finish for someone else. Some things aren't meant to be fixed. They're meant to be witnessed.",
    ],
  },
  {
    id: 'essay-3',
    university: 'Stanford University',
    topic: 'Founding a robotics club at an under-resourced school',
    theme: 'Resourcefulness and building community around a shared problem',
    text: [
      "Our school didn't have a robotics club because it didn't have a robotics budget — not a small one, none. When I asked the vice principal about starting one, she said she'd support it if I could find a way to do it for under $200. I spent that first semester learning more about salvage than about servos.",
      "We built our first chassis out of a broken office chair's base and scrap acrylic from a sign shop that let us take their offcuts. Our \"motor controller\" for the first two months was a relay switch I learned to wire from a YouTube tutorial recorded in 2013. None of it was elegant. Half of it caught fire, in the literal sense, once.",
      "What surprised me wasn't the engineering — it was who showed up. I expected the kids who already loved computers. Instead I got a sophomore who'd never touched a screwdriver but turned out to have an uncanny sense for mechanical balance, and a senior who couldn't code but was the only person patient enough to actually read the sensor's datasheet cover to cover. The club became less about robots and more about finding out what each person was quietly good at, once the entry price wasn't a $3,000 competition kit.",
      "We entered a regional competition eighteen months later with a robot held together by zip ties and stubbornness, and lost in the first round. But three other schools' teams came over afterward to ask how we'd built our drivetrain for what we told them it cost, and that conversation felt like more of a win than advancing would have.",
      "I'm applying to study engineering because I want to keep working on the version of this problem that scales — not just robots, but access. The club still exists without me now, run by the sophomore who found her footing in mechanical design. That, more than any competition result, is the outcome I was actually trying to build.",
    ],
  },
  {
    id: 'essay-4',
    university: 'University of Pennsylvania',
    topic: 'Starting a free weekend coding class for underprivileged middle schoolers',
    theme: 'Teaching as a way of understanding your own knowledge more deeply',
    text: [
      "I thought I understood variables until I tried to explain them to a room of twelve-year-olds using nothing but a whiteboard and a box of labeled jars. \"A variable is a jar with a name on it, and you can change what's inside,\" I said, feeling clever, until a girl named Mia asked, \"So if I put a name in the age jar, does the computer get confused?\" It was a better question than most I'd been asked in my own intro CS class.",
      "I started the Saturday coding class at our community center because I'd noticed the after-school programs near me all charged fees my own family couldn't have afforded a few years earlier. I wasn't a great teacher at first — my instinct was to explain concepts the way textbooks explain them, in order, cleanly. Kids don't learn that way. They learn by breaking things and asking why the thing broke.",
      "Mia's question about jars getting confused turned into an actual unit on data types, because I realized the class didn't have an intuition for the difference between text and numbers until something broke because of it. I rewrote half my curriculum around the mistakes students actually made, instead of the mistakes I'd planned for.",
      "By the end of the semester, twenty-two kids had built a small text-based game, and I had relearned every fundamental of programming by being forced to explain it without jargon. Teaching didn't just transfer what I knew — it exposed the parts of my own understanding that were memorized rather than real. I couldn't hide behind vocabulary with a room of sixth graders who'd immediately ask what a word meant.",
      "I'm still in touch with a few students from that first cohort; two of them now help me run the class. I used to think I started that program to give something back. I've come to think it gave me something too: proof that the clearest sign you understand an idea is whether you can hand it to someone with no reason yet to be patient with you.",
    ],
  },
  {
    id: 'essay-5',
    university: 'UC Berkeley',
    topic: 'Organizing a river cleanup initiative after a family fishing trip',
    theme: 'Turning a personal memory into sustained civic action',
    text: [
      "My grandfather taught me to fish on the Serrano River when I was seven. Twelve years later, I took him back to the same bend in the water and we spent more time pulling plastic bags off our lines than we did actually fishing. He didn't say much about it, but he didn't want to go back after that.",
      "I could have let that be a sad afternoon and nothing else. Instead I spent a week trying to find out who, if anyone, was responsible for that stretch of river, and learned the answer was: technically the county, practically no one, because it fell in a gap between two municipal boundaries neither side wanted to fund.",
      "I organized our first cleanup with nine people — mostly friends who came because I asked, not because they cared yet. We filled eighteen bags of trash in three hours from a quarter-mile stretch. I posted photos, unglamorously, to a neighborhood app most people my age don't use, and the second cleanup had thirty-one people, including two of the county officials I'd emailed who came, I think, mostly out of curiosity about who kept bothering them.",
      "The bureaucratic part turned out to be the real education. I learned how to write a public comment, how to find the right subcommittee for a jurisdictional gap, and how slow \"yes\" can be even when nobody is saying no. It took eight months to get the county to agree to install two trash receptacles at the main access point — a small, almost embarrassingly modest outcome for that much effort.",
      "But the cleanups still happen monthly, run now by a rotating group of neighbors I didn't know a year and a half ago. My grandfather came to the fourth one and didn't say much again, which from him is closer to pride than any speech would have been. I didn't set out to learn local government. I set out to fix one afternoon on one river, and the actual lesson was that fixing anything durable means learning to work inside the systems, tedious as they are, that decide who's responsible for a place.",
    ],
  },
  {
    id: 'essay-6',
    university: 'Cornell University',
    topic: 'Overcoming a stutter to become a competitive debater',
    theme: 'Reframing a perceived weakness as the source of real growth',
    text: [
      "For most of middle school, I planned my sentences around words I could say without stuttering. If \"particularly\" was going to catch, I'd say \"especially\" instead, even if it wasn't quite the word I meant. I got good at a kind of verbal sleight of hand — technically speaking, rarely saying exactly what I thought.",
      "Debate was my sister's idea, not mine, and my first tournament went about as badly as I expected: I froze twice during cross-examination and finished last in my bracket. What kept me coming back wasn't a sudden fix — it was a coach who, instead of telling me to slow down or breathe (advice I'd heard my whole life), asked me to stop avoiding hard words and start choosing the most precise one instead, stutter or not.",
      "It was terrifying advice to follow. My speaking times got worse before they got better, because saying \"particularly\" instead of \"especially\" sometimes meant a visible, audible stumble in front of a judge keeping score. But something shifted around my sophomore year: I noticed I was building better arguments, because I was no longer editing my thinking down to whatever vocabulary my mouth could execute smoothly.",
      "By junior year I'd made it to state semifinals, not because the stutter disappeared — it didn't, and still hasn't fully — but because I'd stopped treating it as the thing that needed to be hidden before the real speaking could happen. My best rounds are still not fluent in the way a debate coach's promotional video would show. They're precise, which turned out to matter more.",
      "I think a lot of people assume the story here ends with the stutter being conquered. It isn't. What changed is that I stopped experiencing it as evidence I had less to say. I still stumble on words in front of rooms of people. I've just decided that's a smaller cost than saying the wrong, easier thing instead.",
    ],
  },
  {
    id: 'essay-7',
    university: 'Northwestern University',
    topic: 'A summer chemistry research program studying water purification methods',
    theme: 'Learning to embrace failed experiments as part of the process',
    text: [
      "My research proposal for the summer chemistry program was, in hindsight, embarrassingly optimistic: I wanted to test whether a low-cost activated-carbon filter derived from rice husks could meaningfully reduce heavy metal concentration in contaminated water samples. My mentor read it, nodded, and said, \"Good. You'll be wrong about most of this by August, and that's the point.\"",
      "She was right. My first six filter batches either fell apart in the testing rig or performed no better than plain sand. I kept a lab notebook that, by week four, was mostly a catalog of things that hadn't worked: wrong carbonization temperature, wrong particle size, one batch that I'm fairly sure I contaminated myself by not cleaning a beaker properly.",
      "What I hadn't expected was how much the failures taught me to ask better questions. By the fifth batch, I wasn't just varying temperature randomly — I had a working theory, built from four failures, about why pore size mattered more than I'd initially modeled. Batch seven reduced lead concentration by 34% in testing, a real number, small in the scheme of solving global water access, but the first result in two months that wasn't a null one.",
      "I used to think research meant being right more than you were wrong. This summer taught me the ratio runs the other way, and that the wrongness isn't a delay before the real work — it is the real work, just not the part anyone puts in a poster presentation. My final report included the failed batches as prominently as batch seven, because the temperature curve I'd built from all six failures was, honestly, the more useful output.",
      "I'm applying to study chemical engineering because I want more summers that look like this one: mostly failure, occasionally interrupted by a number that moves in the right direction. I no longer think that ratio is discouraging. I think it's just what curiosity costs.",
    ],
  },
  {
    id: 'essay-8',
    university: 'Yale University',
    topic: 'Living with dyslexia and becoming a peer reading tutor',
    theme: 'Turning a personal struggle into empathy-driven mentorship',
    text: [
      "I didn't get diagnosed with dyslexia until fourth grade, which meant three years of being quietly convinced I was just bad at reading, in a way that felt like a fact about me rather than a difference in how my brain processed text. I remember the specific relief of the diagnosis — not because it fixed anything, but because it meant there was a reason, and reasons can be worked with.",
      "The accommodations helped: extended time, audiobooks alongside physical copies, a tutor who taught me to break words into syllable chunks instead of trying to read them whole. By eighth grade I was reading close to grade level, though I still read slower than most of my friends and always will.",
      "I started tutoring younger students with reading difficulties in tenth grade, at first because a teacher asked me to and I didn't feel I could say no. I expected to teach the same syllable-chunking method that had worked for me. What I found instead was that every student's version of the difficulty was different — one boy transposed similar-looking letters, another lost his place line to line, and my one-size method didn't fit either of them the way it had fit me.",
      "So I stopped teaching my method and started teaching from theirs. I'd watch where a student actually got stuck, not where the textbook assumed they'd get stuck, and build a workaround from that specific snag. It's slower than following a standard curriculum, and I'm not always right about what will help. But I recognize the look on a kid's face when a technique finally clicks, because I remember having that exact look myself, at a desk much like theirs, four years earlier.",
      "I don't think of my dyslexia as something I overcame so much as something I've learned to work alongside, and tutoring is where that distinction matters most. I'm not teaching these kids to stop being dyslexic. I'm teaching them, the way my own tutor taught me, that the difficulty is real and specific to them, and so is the way through it.",
    ],
  },
];
