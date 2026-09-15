export const presets = [
  {schema: 1, name: 'The quiet breakthrough', policy: {k: 5, authorCap: 2, maxAge: 48, diversity: 0.12, muted: [], weights: {interest: 0.6, quality: 0.3, freshness: 0.1}}, items: [
    {id:'01',title:'A telescope made from a rain barrel',author:'North Studio',topic:'Science',retrieved:true,age:3,signals:{interest:0.96,quality:0.8,freshness:0.97}},
    {id:'02',title:'The city that turned its lights down',author:'Common Ground',topic:'Cities',retrieved:true,age:8,signals:{interest:0.87,quality:0.88,freshness:0.83}},
    {id:'03',title:'When a synthesizer learns to breathe',author:'Small Signals',topic:'Sound',retrieved:true,age:12,signals:{interest:0.85,quality:0.76,freshness:0.75}},
    {id:'04',title:'A quieter way to cool a computer',author:'North Studio',topic:'Science',retrieved:true,age:5,signals:{interest:0.93,quality:0.79,freshness:0.92}},
    {id:'05',title:'The hidden geometry of a leaf',author:'North Studio',topic:'Science',retrieved:true,age:16,signals:{interest:0.94,quality:0.89,freshness:0.67}},
    {id:'06',title:'A library with nothing to borrow',author:'Common Ground',topic:'Culture',retrieved:true,age:18,signals:{interest:0.72,quality:0.91,freshness:0.63}},
    {id:'07',title:'Could a building be a battery?',author:'Open Circuit',topic:'Cities',retrieved:true,age:10,signals:{interest:0.79,quality:0.77,freshness:0.79}},
    {id:'08',title:'Listening to the soil after rain',author:'Moss Radio',topic:'Fieldwork',retrieved:false,age:72,signals:{interest:0.88,quality:0.98,freshness:0.3}},
    {id:'09',title:'A field guide to accidental instruments',author:'Small Signals',topic:'Sound',retrieved:true,age:30,signals:{interest:0.7,quality:0.82,freshness:0.38}},
    {id:'10',title:'The case for very slow machines',author:'Open Circuit',topic:'Design',retrieved:true,age:20,signals:{interest:0.64,quality:0.9,freshness:0.58}},
    {id:'11',title:'An atlas of places between places',author:'Map Room',topic:'Culture',retrieved:true,age:36,signals:{interest:0.65,quality:0.72,freshness:0.25}},
    {id:'12',title:'Repair is a form of invention',author:'Second Life',topic:'Design',retrieved:true,age:14,signals:{interest:0.68,quality:0.85,freshness:0.71}},
    {id:'13',title:'The night garden has its own clock',author:'Moss Radio',topic:'Fieldwork',retrieved:true,age:60,signals:{interest:0.73,quality:0.93,freshness:0.2}},
    {id:'14',title:'What a bridge remembers',author:'Map Room',topic:'Cities',retrieved:false,age:22,signals:{interest:0.8,quality:0.89,freshness:0.54}},
    {id:'15',title:'Making a radio from pencil marks',author:'Open Circuit',topic:'Sound',retrieved:true,age:9,signals:{interest:0.69,quality:0.8,freshness:0.81}},
    {id:'16',title:'The tiny forest inside a terrarium',author:'Second Life',topic:'Fieldwork',retrieved:true,age:4,signals:{interest:0.64,quality:0.83,freshness:0.94}}
  ]}
];
const crowded = structuredClone(presets[0]);
crowded.name = 'One author, too many good ideas';
crowded.policy.authorCap = 1;
crowded.policy.diversity = 0;
crowded.items.find(v => v.id === '08').retrieved = true;
crowded.items.find(v => v.id === '08').age = 24;
presets.push(crowded);
const locked = structuredClone(presets[0]);
locked.name = 'Three gates, one missing voice';
locked.policy.muted = ['Fieldwork'];
presets.push(locked);
