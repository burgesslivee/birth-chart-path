import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";

/* Birth Chart Path - The Birthday Oracle
   366 birthday personalities, 100+ cities, accurate birth charts,
   Moon phase, AI horoscope, zodiac compatibility */

const DEG=Math.PI/180,RAD=180/Math.PI;
const sn=a=>Math.sin(a*DEG),cs=a=>Math.cos(a*DEG),at2=(y,x)=>Math.atan2(y,x)*RAD,norm=a=>((a%360)+360)%360;
const dayNum=(y,m,D,UT)=>367*y-Math.floor(7*(y+Math.floor((m+9)/12))/4)+Math.floor(275*m/9)+D-730530+UT/24;
const kepler=(M,e)=>{M=norm(M);let E=M+e*RAD*Math.sin(M*DEG)*(1+e*Math.cos(M*DEG));for(let i=0;e>.05&&i<25;i++){const d=(E-e*RAD*Math.sin(E*DEG)-M)/(1-e*Math.cos(E*DEG));E-=d;if(Math.abs(d)<1e-6)break}return E};
const trueAnom=(E,e,a)=>{const xv=a*(Math.cos(E*DEG)-e),yv=a*Math.sqrt(1-e*e)*Math.sin(E*DEG);return{v:norm(at2(yv,xv)),r:Math.sqrt(xv*xv+yv*yv)}};
const helio3D=(N,i,w,v,r)=>{const vw=v+w;return{xh:r*(cs(N)*cs(vw)-sn(N)*sn(vw)*cs(i)),yh:r*(sn(N)*cs(vw)+cs(N)*sn(vw)*cs(i))}};
const sunPos=d=>{const w=norm(282.9404+4.70935e-5*d),e=.016709-1.151e-9*d,M=norm(356.047+.9856002585*d),E=kepler(M,e),t=trueAnom(E,e,1),lon=norm(t.v+w);return{lon,xs:t.r*cs(lon),ys:t.r*sn(lon),M,w,Ls:norm(M+w)}};
const ORB={mercury:d=>({N:norm(48.3313+3.24587e-5*d),i:7.0047,w:norm(29.1241+1.01444e-5*d),a:.387098,e:.205635,M:norm(168.6562+4.0923344368*d)}),venus:d=>({N:norm(76.6799+2.4659e-5*d),i:3.3946,w:norm(54.891+1.38374e-5*d),a:.72333,e:.006773,M:norm(48.0052+1.6021302244*d)}),mars:d=>({N:norm(49.5574+2.11081e-5*d),i:1.8497,w:norm(286.5016+2.92961e-5*d),a:1.523688,e:.093405,M:norm(18.6021+.5240207766*d)}),jupiter:d=>({N:norm(100.4542+2.76854e-5*d),i:1.303,w:norm(273.8777+1.64505e-5*d),a:5.20256,e:.048498,M:norm(19.895+.0830853001*d)}),saturn:d=>({N:norm(113.6634+2.3898e-5*d),i:2.4886,w:norm(339.3939+2.97661e-5*d),a:9.55475,e:.055546,M:norm(316.967+.0334442282*d)})};
const planetLon=(d,n)=>{const s=sunPos(d),o=ORB[n](d),E=kepler(o.M,o.e),t=trueAnom(E,o.e,o.a),h=helio3D(o.N,o.i,o.w,t.v,t.r);return norm(at2(h.yh+s.ys,h.xh+s.xs))};
const moonLon=d=>{const N=norm(125.1228-.0529538083*d),w=norm(318.0634+.1643573223*d),M=norm(115.3654+13.0649929509*d),E=kepler(M,.0549),t=trueAnom(E,.0549,60.2666),h=helio3D(N,5.1454,w,t.v,t.r),sW=norm(282.9404+4.70935e-5*d),sM=norm(356.047+.9856002585*d),Ls=norm(sM+sW),Lm=norm(M+w+N),D=norm(Lm-Ls);return norm(at2(h.yh,h.xh)-1.274*sn(M-2*D)+.658*sn(2*D)-.186*sn(sM))};
const calcAsc=(d,ut,lng,lat)=>{const s=sunPos(d),LST=norm(norm(s.Ls+180)+ut*15.04107+lng),ob=(23.4393-3.563e-7*d)*DEG;return norm(Math.atan2(-Math.cos(LST*DEG),Math.sin(LST*DEG)*Math.cos(ob)+Math.tan(lat*DEG)*Math.sin(ob))*RAD)};
const SIGN_ORDER=["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
const signOf=lng=>{const n=norm(lng),i=Math.floor(n/30),d=n%30;return{sign:SIGN_ORDER[i],deg:Math.floor(d),min:Math.floor((d%1)*60)}};
const birthChart=(yr,mo,dy,hr,lat,lng)=>{const tz=Math.round(lng/15),ut=hr-tz,d=dayNum(yr,mo,dy,ut);return{sun:signOf(sunPos(d).lon),moon:signOf(moonLon(d)),rising:signOf(calcAsc(d,ut,lng,lat)),mercury:signOf(planetLon(d,"mercury")),venus:signOf(planetLon(d,"venus")),mars:signOf(planetLon(d,"mars")),jupiter:signOf(planetLon(d,"jupiter")),saturn:signOf(planetLon(d,"saturn"))}};

const getMoonPhase=()=>{const now=new Date(),ref=new Date(2000,0,6,18,14),SYN=29.53058770576,ds=(now-ref)/864e5,ph=((ds%SYN)+SYN)%SYN,pct=ph/SYN,ill=Math.round((1-Math.cos(pct*2*Math.PI))/2*100);const names=[["New Moon","\u{1F311}","Set intentions"],["Waxing Crescent","\u{1F312}","Take the first step"],["First Quarter","\u{1F313}","Decision time"],["Waxing Gibbous","\u{1F314}","Refine and persist"],["Full Moon","\u{1F315}","Everything illuminated"],["Waning Gibbous","\u{1F316}","Share what you learned"],["Last Quarter","\u{1F317}","Let go of what's not working"],["Waning Crescent","\u{1F318}","Rest and surrender"]];const ix=Math.min(Math.floor(pct*8),7);return{name:names[ix][0],icon:names[ix][1],msg:names[ix][2],pct:ill,day:Math.round(ph*10)/10,next:Math.round((SYN-ph)*10)/10}};

const CITIES={"new york,ny":[40.71,-74.01],"los angeles,ca":[34.05,-118.24],"chicago,il":[41.88,-87.63],"houston,tx":[29.76,-95.37],"phoenix,az":[33.45,-112.07],"philadelphia,pa":[39.95,-75.17],"san antonio,tx":[29.42,-98.49],"san diego,ca":[32.72,-117.16],"dallas,tx":[32.78,-96.80],"austin,tx":[30.27,-97.74],"jacksonville,fl":[30.33,-81.66],"san francisco,ca":[37.77,-122.42],"seattle,wa":[47.61,-122.33],"denver,co":[39.74,-104.98],"washington,dc":[38.91,-77.04],"nashville,tn":[36.16,-86.78],"boston,ma":[42.36,-71.06],"portland,or":[45.52,-122.67],"las vegas,nv":[36.17,-115.14],"atlanta,ga":[33.75,-84.39],"miami,fl":[25.76,-80.19],"minneapolis,mn":[44.98,-93.27],"tampa,fl":[27.95,-82.46],"new orleans,la":[29.95,-90.07],"cleveland,oh":[41.50,-81.69],"pittsburgh,pa":[40.44,-79.99],"detroit,mi":[42.33,-83.05],"salt lake city,ut":[40.76,-111.89],"honolulu,hi":[21.31,-157.86],"orlando,fl":[28.54,-81.38],"queen creek,az":[33.25,-111.63],"scottsdale,az":[33.49,-111.93],"gilbert,az":[33.35,-111.79],"chandler,az":[33.30,-111.84],"tempe,az":[33.43,-111.94],"mesa,az":[33.42,-111.83],"tucson,az":[32.22,-110.93],"flagstaff,az":[35.20,-111.65],"sedona,az":[34.87,-111.76],"charlotte,nc":[35.23,-80.84],"raleigh,nc":[35.78,-78.64],"indianapolis,in":[39.77,-86.16],"columbus,oh":[39.96,-82.99],"sacramento,ca":[38.58,-121.49],"kansas city,mo":[39.10,-94.58],"st louis,mo":[38.63,-90.20],"cincinnati,oh":[39.10,-84.51],"milwaukee,wi":[43.04,-87.91],"omaha,ne":[41.26,-95.93],"oklahoma city,ok":[35.47,-97.52],"memphis,tn":[35.15,-90.05],"louisville,ky":[38.25,-85.76],"baltimore,md":[39.29,-76.61],"albuquerque,nm":[35.08,-106.65],"fresno,ca":[36.74,-119.77],"el paso,tx":[31.76,-106.44],"san jose,ca":[37.34,-121.89],"boise,id":[43.62,-116.21],"richmond,va":[37.54,-77.43],"birmingham,al":[33.52,-86.81],"anchorage,ak":[61.22,-149.90],"spokane,wa":[47.66,-117.43],"madison,wi":[43.07,-89.40],"little rock,ar":[34.75,-92.29],"des moines,ia":[41.59,-93.62],"jackson,ms":[32.30,-90.18],"hartford,ct":[41.76,-72.68],"charleston,sc":[32.78,-79.93],"providence,ri":[41.82,-71.41],"knoxville,tn":[35.96,-83.92],"savannah,ga":[32.08,-81.09],"glendale,az":[33.54,-112.19],"peoria,az":[33.58,-112.24],"surprise,az":[33.63,-112.37],"goodyear,az":[33.44,-112.36],"avondale,az":[33.44,-112.35],"buckeye,az":[33.37,-112.58],"maricopa,az":[33.06,-112.05],"casa grande,az":[32.88,-111.76],"florence,az":[33.03,-111.39],"apache junction,az":[33.42,-111.55],"gold canyon,az":[33.37,-111.44],"anthem,az":[33.87,-112.15],"fountain hills,az":[33.61,-111.73],"paradise valley,az":[33.53,-111.94],"cave creek,az":[33.83,-111.95],"payson,az":[34.23,-111.33],"prescott,az":[34.54,-112.47],"kingman,az":[35.19,-114.05],"lake havasu city,az":[34.48,-114.32],"yuma,az":[32.69,-114.62],"sierra vista,az":[31.55,-110.30],"san tan valley,az":[33.19,-111.56],"show low,az":[34.25,-110.03]};

const BDAYS = {"1-1":"The Fresh Starter","1-2":"The Silent Authority","1-3":"The Quiet Visionary","1-4":"The Determined Architect","1-5":"The Restless Seeker","1-6":"The Magnetic Introvert","1-7":"The Fierce Protector","1-8":"The Pattern Breaker","1-9":"The Ambitious Dreamer","1-10":"The Grounded Rebel","1-11":"The Deep Listener","1-12":"The Relentless Builder","1-13":"The Charming Strategist","1-14":"The Passionate Scholar","1-15":"The Humanitarian Force","1-16":"The Emotional Fortress","1-17":"The Creative Disciplinarian","1-18":"The Natural Leader","1-19":"The Inventive Mind","1-20":"The Loyal Warrior","1-21":"The Eccentric Genius","1-22":"The Intuitive Strategist","1-23":"The Resilient Spirit","1-24":"The Observant Artist","1-25":"The Bold Truth-Teller","1-26":"The Devoted Craftsman","1-27":"The Thoughtful Rebel","1-28":"The Warm Strategist","1-29":"The Independent Spirit","1-30":"The Philosophical Fighter","1-31":"The Quietly Powerful","2-1":"The Progressive Thinker","2-2":"The Gentle Powerhouse","2-3":"The Social Architect","2-4":"The Passionate Analyst","2-5":"The Daring Original","2-6":"The Romantic Realist","2-7":"The Empathic Leader","2-8":"The Creative Problem-Solver","2-9":"The Idealistic Warrior","2-10":"The Magnetic Storyteller","2-11":"The Inventive Healer","2-12":"The Free-Spirited Sage","2-13":"The Unconventional Success","2-14":"The Devoted Romantic","2-15":"The Analytical Dreamer","2-16":"The Tenacious Optimist","2-17":"The Bold Connector","2-18":"The Wise Provocateur","2-19":"The Compassionate Mystic","2-20":"The Grounded Visionary","2-21":"The Quiet Revolutionary","2-22":"The Emotionally Brave","2-23":"The Strategic Dreamer","2-24":"The Loyal Maverick","2-25":"The Sensitive Warrior","2-26":"The Harmonious Rebel","2-27":"The Perceptive Creator","2-28":"The Enduring Optimist","2-29":"The Rare Spirit","3-1":"The Intuitive Pioneer","3-2":"The Compassionate Powerhouse","3-3":"The Artistic Strategist","3-4":"The Emotionally Intelligent Leader","3-5":"The Restless Perfectionist","3-6":"The Dreamy Pragmatist","3-7":"The Gentle Disruptor","3-8":"The Romantic Realist","3-9":"The Resilient Idealist","3-10":"The Perceptive Protector","3-11":"The Creative Force","3-12":"The Observant Healer","3-13":"The Adventurous Soul","3-14":"The Thoughtful Maverick","3-15":"The Empathic Strategist","3-16":"The Bold Dreamer","3-17":"The Patient Revolutionary","3-18":"The Sensitive Powerhouse","3-19":"The Adventurous Sage","3-20":"The Quietly Magnetic","3-21":"The Balanced Warrior","3-22":"The Nurturing Leader","3-23":"The Eternal Student","3-24":"The Independent Empath","3-25":"The Dynamic Creator","3-26":"The Devoted Innovator","3-27":"The Philosophical Artist","3-28":"The Warm Strategist","3-29":"The Courageous Dreamer","3-30":"The Resilient Optimist","3-31":"The Boundary Crosser","4-1":"The Fearless Initiator","4-2":"The Persistent Dreamer","4-3":"The Magnetic Leader","4-4":"The Grounded Fire","4-5":"The Creative Warrior","4-6":"The Reliable Revolutionary","4-7":"The Passionate Thinker","4-8":"The Quiet Conqueror","4-9":"The Idealistic Doer","4-10":"The Bold Communicator","4-11":"The Strategic Optimist","4-12":"The Emotional Alchemist","4-13":"The Pioneering Spirit","4-14":"The Generous Fighter","4-15":"The Practical Visionary","4-16":"The Radiant Force","4-17":"The Thoughtful Rebel","4-18":"The Resilient Creator","4-19":"The Independent Leader","4-20":"The Sensitive Strategist","4-21":"The Focused Dreamer","4-22":"The Loyal Innovator","4-23":"The Magnetic Healer","4-24":"The Tenacious Builder","4-25":"The Artistic Fire","4-26":"The Practical Mystic","4-27":"The Bold Protector","4-28":"The Diplomatic Warrior","4-29":"The Observant Leader","4-30":"The Creative Phoenix","5-1":"The Steadfast Creator","5-2":"The Sensual Strategist","5-3":"The Patient Powerhouse","5-4":"The Devoted Artist","5-5":"The Practical Romantic","5-6":"The Natural Abundance","5-7":"The Thoughtful Hedonist","5-8":"The Loyal Visionary","5-9":"The Resilient Beauty","5-10":"The Grounded Dreamer","5-11":"The Magnetic Communicator","5-12":"The Stubborn Genius","5-13":"The Nurturing Powerhouse","5-14":"The Creative Investor","5-15":"The Persistent Romantic","5-16":"The Elegant Warrior","5-17":"The Quiet Influence","5-18":"The Ambitious Nurturer","5-19":"The Energetic Builder","5-20":"The Methodical Dreamer","5-21":"The Passionate Stabilizer","5-22":"The Strategic Sensualist","5-23":"The Devoted Builder","5-24":"The Intuitive Materialist","5-25":"The Persistent Creator","5-26":"The Warm Authority","5-27":"The Unconventional Traditionalist","5-28":"The Restless Perfectionist","5-29":"The Dynamic Stabilizer","5-30":"The Thoughtful Hedonist","5-31":"The Bridge Builder","6-1":"The Brilliant Adapter","6-2":"The Curious Connector","6-3":"The Witty Strategist","6-4":"The Versatile Creator","6-5":"The Social Genius","6-6":"The Intellectual Romantic","6-7":"The Chameleon Leader","6-8":"The Restless Innovator","6-9":"The Charming Truth-Teller","6-10":"The Dual Nature","6-11":"The Emotionally Agile","6-12":"The Quick Study","6-13":"The Gentle Provocateur","6-14":"The Romantic Communicator","6-15":"The Adaptable Warrior","6-16":"The Perceptive Twin","6-17":"The Creative Messenger","6-18":"The Intellectual Adventurer","6-19":"The Curious Empath","6-20":"The Dynamic Thinker","6-21":"The Celebratory Spirit","6-22":"The Articulate Dreamer","6-23":"The Sensitive Intellectual","6-24":"The Nurturing Communicator","6-25":"The Freedom Seeker","6-26":"The Observant Wit","6-27":"The Versatile Healer","6-28":"The Luminous Mind","6-29":"The Balanced Communicator","6-30":"The Transformative Voice","7-1":"The Emotional Architect","7-2":"The Intuitive Protector","7-3":"The Nurturing Force","7-4":"The Sensitive Strategist","7-5":"The Creative Nurturer","7-6":"The Loyal Defender","7-7":"The Intuitive Leader","7-8":"The Emotional Powerhouse","7-9":"The Tenacious Heart","7-10":"The Protective Visionary","7-11":"The Empathic Creator","7-12":"The Resilient Caretaker","7-13":"The Magnetic Nurturer","7-14":"The Strategic Heart","7-15":"The Creative Protector","7-16":"The Passionate Homebody","7-17":"The Intuitive Communicator","7-18":"The Emotional Alchemist","7-19":"The Devoted Creator","7-20":"The Protective Leader","7-21":"The Intuitive Builder","7-22":"The Magnetic Presence","7-23":"The Heart-Led Pioneer","7-24":"The Dramatic Visionary","7-25":"The Radiant Leader","7-26":"The Generous Spirit","7-27":"The Creative Authority","7-28":"The Warm Strategist","7-29":"The Loyal Visionary","7-30":"The Courageous Heart","7-31":"The Transformative Nurturer","8-1":"The Radiant Creator","8-2":"The Generous Leader","8-3":"The Dramatic Thinker","8-4":"The Warm Authority","8-5":"The Creative Powerhouse","8-6":"The Proud Healer","8-7":"The Magnetic Performer","8-8":"The Ambitious Heart","8-9":"The Radiant Rebel","8-10":"The Creative Strategist","8-11":"The Generous Genius","8-12":"The Passionate Builder","8-13":"The Dramatic Empath","8-14":"The Bold Nurturer","8-15":"The Creative Warrior","8-16":"The Radiant Communicator","8-17":"The Loyal Fire","8-18":"The Ambitious Dreamer","8-19":"The Humanitarian Leader","8-20":"The Warm Revolutionary","8-21":"The Elegant Power","8-22":"The Observant Creator","8-23":"The Inventive Leader","8-24":"The Passionate Perfectionist","8-25":"The Practical Visionary","8-26":"The Diplomatic Fire","8-27":"The Bold Thinker","8-28":"The Creative Phoenix","8-29":"The Refined Rebel","8-30":"The Generous Creator","8-31":"The Transitional Force","9-1":"The Precise Creator","9-2":"The Devoted Analyst","9-3":"The Practical Healer","9-4":"The Elegant Problem-Solver","9-5":"The Nurturing Critic","9-6":"The Methodical Creator","9-7":"The Observant Leader","9-8":"The Compassionate Perfectionist","9-9":"The Intellectual Nurturer","9-10":"The Practical Mystic","9-11":"The Disciplined Dreamer","9-12":"The Gentle Genius","9-13":"The Devoted Worker","9-14":"The Analytical Romantic","9-15":"The Quiet Perfectionist","9-16":"The Healing Presence","9-17":"The Precise Communicator","9-18":"The Analytical Empath","9-19":"The Resilient Servant","9-20":"The Observant Creator","9-21":"The Balanced Perfectionist","9-22":"The Methodical Revolutionary","9-23":"The Intuitive Analyst","9-24":"The Practical Romantic","9-25":"The Graceful Critic","9-26":"The Devoted Innovator","9-27":"The Thoughtful Healer","9-28":"The Resilient Perfectionist","9-29":"The Quiet Authority","9-30":"The Transitional Mind","10-1":"The Elegant Mediator","10-2":"The Charming Analyst","10-3":"The Artistic Diplomat","10-4":"The Fair-Minded Leader","10-5":"The Romantic Strategist","10-6":"The Social Architect","10-7":"The Graceful Warrior","10-8":"The Balanced Creator","10-9":"The Diplomatic Genius","10-10":"The Intuitive Designer","10-11":"The Harmonious Leader","10-12":"The Observant Romantic","10-13":"The Strategic Beauty","10-14":"The Gentle Powerhouse","10-15":"The Creative Mediator","10-16":"The Passionate Diplomat","10-17":"The Elegant Rebel","10-18":"The Intuitive Connector","10-19":"The Balanced Visionary","10-20":"The Charming Truth-Teller","10-21":"The Devoted Partner","10-22":"The Artistic Strategist","10-23":"The Harmonious Rebel","10-24":"The Perceptive Creator","10-25":"The Magnetic Diplomat","10-26":"The Intense Harmonizer","10-27":"The Creative Justice","10-28":"The Passionate Analyst","10-29":"The Diplomatic Visionary","10-30":"The Powerful Balancer","10-31":"The Transformative Diplomat","11-1":"The Intense Visionary","11-2":"The Quiet Investigator","11-3":"The Passionate Analyst","11-4":"The Transformative Leader","11-5":"The Magnetic Depth","11-6":"The Strategic Mystic","11-7":"The Resilient Phoenix","11-8":"The Devoted Detective","11-9":"The Passionate Protector","11-10":"The Transformative Creator","11-11":"The Intense Communicator","11-12":"The Magnetic Healer","11-13":"The Strategic Empath","11-14":"The Powerful Observer","11-15":"The Passionate Builder","11-16":"The Honest Mirror","11-17":"The Transformative Thinker","11-18":"The Intense Romantic","11-19":"The Resilient Warrior","11-20":"The Perceptive Leader","11-21":"The Philosophical Warrior","11-22":"The Adventurous Sage","11-23":"The Restless Seeker","11-24":"The Loyal Transformer","11-25":"The Intense Creator","11-26":"The Magnetic Teacher","11-27":"The Ambitious Sage","11-28":"The Resilient Optimist","11-29":"The Strategic Freedom","11-30":"The Versatile Philosopher","12-1":"The Expansive Thinker","12-2":"The Adventurous Teacher","12-3":"The Philosophical Warrior","12-4":"The Optimistic Strategist","12-5":"The Restless Creator","12-6":"The Honest Visionary","12-7":"The Generous Philosopher","12-8":"The Bold Explorer","12-9":"The Passionate Educator","12-10":"The Independent Thinker","12-11":"The Adventurous Leader","12-12":"The Practical Philosopher","12-13":"The Intense Optimist","12-14":"The Strategic Explorer","12-15":"The Generous Warrior","12-16":"The Honest Creator","12-17":"The Ambitious Philosopher","12-18":"The Resilient Explorer","12-19":"The Free-Spirited Builder","12-20":"The Optimistic Revolutionary","12-21":"The Philosophical Leader","12-22":"The Driven Architect","12-23":"The Ambitious Dreamer","12-24":"The Resilient Authority","12-25":"The Generous Spirit","12-26":"The Practical Mystic","12-27":"The Quiet Power","12-28":"The Enduring Light","12-29":"The Reflective Warrior","12-30":"The Hopeful Realist","12-31":"The Year's Completion"};

const HIST = {"1-1":"Paul Revere (1735)","1-2":"Isaac Asimov (1920)","1-3":"J.R.R. Tolkien (1892)","1-4":"Isaac Newton (1643)","1-5":"King Juan Carlos I (1938)","1-6":"Joan of Arc (1412)","1-7":"Millard Fillmore (1800)","1-8":"Elvis Presley (1935)","1-9":"Richard Nixon (1913)","1-10":"Alexander Hamilton (1755)","1-11":"Alexander Hamilton (1757)","1-12":"Jack London (1876)","1-13":"Horatio Alger Jr. (1832)","1-14":"Benedict Arnold (1741)","1-15":"Martin Luther King Jr. (1929)","1-16":"Benjamin Franklin (1706)","1-17":"Muhammad Ali (1942)","1-18":"Daniel Webster (1782)","1-19":"Robert E. Lee (1807)","1-20":"George Burns (1896)","1-21":"Thomas Jonathan Jackson (1824)","1-22":"Francis Bacon (1561)","1-23":"John Hancock (1737)","1-24":"Hadrian (76)","1-25":"Robert Burns (1759)","1-26":"Douglas MacArthur (1880)","1-27":"Wolfgang Mozart (1756)","1-28":"Henry VII (1457)","1-29":"William McKinley (1843)","1-30":"Franklin D. Roosevelt (1882)","1-31":"Jackie Robinson (1919)","2-1":"Clark Gable (1901)","2-2":"James Joyce (1882)","2-3":"Norman Rockwell (1894)","2-4":"Rosa Parks (1913)","2-5":"Hank Aaron (1934)","2-6":"Babe Ruth (1895)","2-7":"Charles Dickens (1812)","2-8":"Jules Verne (1828)","2-9":"William Henry Harrison (1773)","2-10":"Jimmy Durante (1893)","2-11":"Thomas Edison (1847)","2-12":"Abraham Lincoln (1809)","2-13":"Chuck Yeager (1923)","2-14":"Frederick Douglass (1818)","2-15":"Galileo Galilei (1564)","2-16":"Sonny Bono (1935)","2-17":"Michael Jordan (1963)","2-18":"Toni Morrison (1931)","2-19":"Nicolaus Copernicus (1473)","2-20":"Ansel Adams (1902)","2-21":"Nina Simone (1933)","2-22":"George Washington (1732)","2-23":"W.E.B. Du Bois (1868)","2-24":"Steve Jobs (1955)","2-25":"Pierre-Auguste Renoir (1841)","2-26":"Buffalo Bill Cody (1846)","2-27":"Henry Wadsworth Longfellow (1807)","2-28":"Linus Pauling (1901)","2-29":"Superman first appears (1940)","3-1":"Glenn Miller (1904)","3-2":"Dr. Seuss (1904)","3-3":"Alexander Graham Bell (1847)","3-4":"Antonio Vivaldi (1678)","3-5":"Rosa Luxemburg (1871)","3-6":"Michelangelo (1475)","3-7":"Luther Burbank (1849)","3-8":"Oliver Wendell Holmes Jr. (1841)","3-9":"Amerigo Vespucci (1454)","3-10":"Harriet Tubman (1822)","3-11":"Douglas Adams (1952)","3-12":"Jack Kerouac (1922)","3-13":"Joseph Priestley (1733)","3-14":"Albert Einstein (1879)","3-15":"Andrew Jackson (1767)","3-16":"James Madison (1751)","3-17":"Nat King Cole (1919)","3-18":"Grover Cleveland (1837)","3-19":"Wyatt Earp (1848)","3-20":"Fred Rogers (1928)","3-21":"Johann Sebastian Bach (1685)","3-22":"Chico Marx (1887)","3-23":"Akira Kurosawa (1910)","3-24":"Harry Houdini (1874)","3-25":"Aretha Franklin (1942)","3-26":"Sandra Day O'Connor (1930)","3-27":"Ludwig van Beethoven (1770)","3-28":"Reba McEntire (1955)","3-29":"John Tyler (1790)","3-30":"Vincent van Gogh (1853)","3-31":"Rene Descartes (1596)","4-1":"Otto von Bismarck (1815)","4-2":"Charlemagne (742)","4-3":"Washington Irving (1783)","4-4":"Maya Angelou (1928)","4-5":"Booker T. Washington (1856)","4-6":"Harry Houdini (1874)","4-7":"William Wordsworth (1770)","4-8":"Betty Ford (1918)","4-9":"Hugh Hefner (1926)","4-10":"Joseph Pulitzer (1847)","4-11":"Ethel Kennedy (1928)","4-12":"Thomas Jefferson (1743)","4-13":"Thomas Jefferson (1743)","4-14":"Abraham Lincoln (1865)","4-15":"Leonardo da Vinci (1452)","4-16":"Charlie Chaplin (1889)","4-17":"J.P. Morgan (1837)","4-18":"Clarence Darrow (1857)","4-19":"Maria Sharapova (1987)","4-20":"Adolf Hitler (1889)","4-21":"Queen Elizabeth II (1926)","4-22":"Immanuel Kant (1724)","4-23":"William Shakespeare (1564)","4-24":"Barbra Streisand (1942)","4-25":"Ella Fitzgerald (1917)","4-26":"John James Audubon (1785)","4-27":"Ulysses S. Grant (1822)","4-28":"James Monroe (1758)","4-29":"Duke Ellington (1899)","4-30":"Willie Nelson (1933)","5-1":"Joseph Heller (1923)","5-2":"Dwayne Johnson (1972)","5-3":"Niccolo Machiavelli (1469)","5-4":"Audrey Hepburn (1929)","5-5":"Karl Marx (1818)","5-6":"Sigmund Freud (1856)","5-7":"Johannes Brahms (1833)","5-8":"Harry S. Truman (1884)","5-9":"John Brown (1800)","5-10":"Fred Astaire (1899)","5-11":"Salvador Dali (1904)","5-12":"Florence Nightingale (1820)","5-13":"Stevie Wonder (1950)","5-14":"Mark Zuckerberg (1984)","5-15":"Emily Dickinson (1830)","5-16":"Liberace (1919)","5-17":"Erik Satie (1866)","5-18":"Pope John Paul II (1920)","5-19":"Malcolm X (1925)","5-20":"Cher (1946)","5-21":"Fats Waller (1904)","5-22":"Arthur Conan Doyle (1859)","5-23":"Carolus Linnaeus (1707)","5-24":"Queen Victoria (1819)","5-25":"Ralph Waldo Emerson (1803)","5-26":"John Wayne (1907)","5-27":"Wild Bill Hickok (1837)","5-28":"Ian Fleming (1908)","5-29":"John F. Kennedy (1917)","5-30":"Mel Blanc (1908)","5-31":"Walt Whitman (1819)","6-1":"Marilyn Monroe (1926)","6-2":"Marquis de Sade (1740)","6-3":"Jefferson Davis (1808)","6-4":"Angelina Jolie (1975)","6-5":"John Maynard Keynes (1883)","6-6":"Nathan Hale (1755)","6-7":"Prince (1958)","6-8":"Frank Lloyd Wright (1867)","6-9":"Cole Porter (1891)","6-10":"Judy Garland (1922)","6-11":"Jacques Cousteau (1910)","6-12":"Anne Frank (1929)","6-13":"William Butler Yeats (1865)","6-14":"Harriet Beecher Stowe (1811)","6-15":"Ice Cube (1969)","6-16":"Tupac Shakur (1971)","6-17":"Igor Stravinsky (1882)","6-18":"Paul McCartney (1942)","6-19":"Blaise Pascal (1623)","6-20":"Lionel Richie (1949)","6-21":"Jean-Paul Sartre (1905)","6-22":"Meryl Streep (1949)","6-23":"Alan Turing (1912)","6-24":"Jack Dempsey (1895)","6-25":"George Orwell (1903)","6-26":"Pearl S. Buck (1892)","6-27":"Helen Keller (1880)","6-28":"Henry VIII (1491)","6-29":"George Goethals (1858)","6-30":"Mike Tyson (1966)","7-1":"Princess Diana (1961)","7-2":"Thurgood Marshall (1908)","7-3":"Franz Kafka (1883)","7-4":"Calvin Coolidge (1872)","7-5":"P.T. Barnum (1810)","7-6":"George W. Bush (1946)","7-7":"Marc Chagall (1887)","7-8":"John D. Rockefeller (1839)","7-9":"Nikola Tesla (1856)","7-10":"Nikola Tesla (1856)","7-11":"John Quincy Adams (1767)","7-12":"Henry David Thoreau (1817)","7-13":"Harrison Ford (1942)","7-14":"Gerald Ford (1913)","7-15":"Rembrandt (1606)","7-16":"Ida B. Wells (1862)","7-17":"Phyllis Diller (1917)","7-18":"Nelson Mandela (1918)","7-19":"Samuel Colt (1814)","7-20":"Sir Edmund Hillary (1919)","7-21":"Ernest Hemingway (1899)","7-22":"Alexander the Great (356 BC)","7-23":"Daniel Radcliffe (1989)","7-24":"Amelia Earhart (1897)","7-25":"Walter Payton (1954)","7-26":"Mick Jagger (1943)","7-27":"Peggy Fleming (1948)","7-28":"Beatrix Potter (1866)","7-29":"Mussolini (1883)","7-30":"Henry Ford (1863)","7-31":"J.K. Rowling (1965)","8-1":"Herman Melville (1819)","8-2":"James Baldwin (1924)","8-3":"Tony Bennett (1926)","8-4":"Barack Obama (1961)","8-5":"Neil Armstrong (1930)","8-6":"Alexander Fleming (1881)","8-7":"Mata Hari (1876)","8-8":"Roger Federer (1981)","8-9":"Whitney Houston (1963)","8-10":"Herbert Hoover (1874)","8-11":"Hulk Hogan (1953)","8-12":"Erwin Schrodinger (1887)","8-13":"Alfred Hitchcock (1899)","8-14":"Magic Johnson (1959)","8-15":"Napoleon Bonaparte (1769)","8-16":"Madonna (1958)","8-17":"Davy Crockett (1786)","8-18":"Virginia Dare (1587)","8-19":"Coco Chanel (1883)","8-20":"H.P. Lovecraft (1890)","8-21":"Count Basie (1904)","8-22":"Claude Debussy (1862)","8-23":"Kobe Bryant (1978)","8-24":"Paulo Coelho (1947)","8-25":"Sean Connery (1930)","8-26":"Mother Teresa (1910)","8-27":"Lyndon B. Johnson (1908)","8-28":"Johann Wolfgang von Goethe (1749)","8-29":"John Locke (1632)","8-30":"Mary Shelley (1797)","8-31":"Maria Montessori (1870)","9-1":"Rocky Marciano (1923)","9-2":"Keanu Reeves (1964)","9-3":"Shaun White (1986)","9-4":"Beyonce (1981)","9-5":"Freddie Mercury (1946)","9-6":"Marquis de Lafayette (1757)","9-7":"Elizabeth I (1533)","9-8":"Peter Sellers (1925)","9-9":"Leo Tolstoy (1828)","9-10":"Arnold Palmer (1929)","9-11":"O. Henry (1862)","9-12":"Jesse Owens (1913)","9-13":"Roald Dahl (1916)","9-14":"Margaret Sanger (1879)","9-15":"Agatha Christie (1890)","9-16":"B.B. King (1925)","9-17":"William Carlos Williams (1883)","9-18":"Samuel Johnson (1709)","9-19":"Jimmy Fallon (1974)","9-20":"Sophia Loren (1934)","9-21":"Stephen King (1947)","9-22":"Michael Faraday (1791)","9-23":"Augustus Caesar (63 BC)","9-24":"F. Scott Fitzgerald (1896)","9-25":"William Faulkner (1897)","9-26":"Johnny Appleseed (1774)","9-27":"Samuel Adams (1722)","9-28":"Confucius (551 BC)","9-29":"Michelangelo Caravaggio (1571)","9-30":"Truman Capote (1924)","10-1":"Jimmy Carter (1924)","10-2":"Mahatma Gandhi (1869)","10-3":"Gore Vidal (1925)","10-4":"Buster Keaton (1895)","10-5":"Chester A. Arthur (1829)","10-6":"Thor Heyerdahl (1914)","10-7":"Desmond Tutu (1931)","10-8":"Jesse Jackson (1941)","10-9":"John Lennon (1940)","10-10":"Giuseppe Verdi (1813)","10-11":"Eleanor Roosevelt (1884)","10-12":"Christopher Columbus (1451)","10-13":"Margaret Thatcher (1925)","10-14":"Dwight D. Eisenhower (1890)","10-15":"Friedrich Nietzsche (1844)","10-16":"Oscar Wilde (1854)","10-17":"Arthur Miller (1915)","10-18":"Chuck Berry (1926)","10-19":"John Adams (1735)","10-20":"Christopher Wren (1632)","10-21":"Alfred Nobel (1833)","10-22":"Franz Liszt (1811)","10-23":"Johnny Carson (1925)","10-24":"Kevin Kline (1947)","10-25":"Pablo Picasso (1881)","10-26":"Hillary Clinton (1947)","10-27":"Theodore Roosevelt (1858)","10-28":"Jonas Salk (1914)","10-29":"James Boswell (1740)","10-30":"John Adams (1735)","10-31":"John Keats (1795)","11-1":"Tim Cook (1960)","11-2":"Daniel Boone (1734)","11-3":"Roseanne Barr (1952)","11-4":"Will Rogers (1879)","11-5":"Vivien Leigh (1913)","11-6":"John Philip Sousa (1854)","11-7":"Marie Curie (1867)","11-8":"Bram Stoker (1847)","11-9":"Carl Sagan (1934)","11-10":"Martin Luther (1483)","11-11":"Kurt Vonnegut (1922)","11-12":"Grace Kelly (1929)","11-13":"Robert Louis Stevenson (1850)","11-14":"Claude Monet (1840)","11-15":"William Pitt the Elder (1708)","11-16":"W.C. Handy (1873)","11-17":"Martin Scorsese (1942)","11-18":"Mickey Mouse (1928)","11-19":"James Garfield (1831)","11-20":"Robert F. Kennedy (1925)","11-21":"Voltaire (1694)","11-22":"Scarlett Johansson (1984)","11-23":"Franklin Pierce (1804)","11-24":"Zachary Taylor (1784)","11-25":"Andrew Carnegie (1835)","11-26":"Charles Schulz (1922)","11-27":"Bruce Lee (1940)","11-28":"William Blake (1757)","11-29":"Louisa May Alcott (1832)","11-30":"Mark Twain (1835)","12-1":"Woody Allen (1935)","12-2":"Britney Spears (1981)","12-3":"Ozzy Osbourne (1948)","12-4":"Jay-Z (1969)","12-5":"Walt Disney (1901)","12-6":"Thomas Edison makes first sound recording (1877)","12-7":"Noam Chomsky (1928)","12-8":"Sammy Davis Jr. (1925)","12-9":"Kirk Douglas (1916)","12-10":"Emily Dickinson (1830)","12-11":"Alexander Solzhenitsyn (1918)","12-12":"Frank Sinatra (1915)","12-13":"Taylor Swift (1989)","12-14":"Nostradamus (1503)","12-15":"Nero (37)","12-16":"Ludwig van Beethoven (1770)","12-17":"Pope Francis (1936)","12-18":"Joseph Stalin (1878)","12-19":"Benjamin Franklin (1706)","12-20":"Harvey Firestone (1868)","12-21":"Benjamin Disraeli (1804)","12-22":"Giacomo Puccini (1858)","12-23":"Joseph Smith (1805)","12-24":"Howard Hughes (1905)","12-25":"Isaac Newton (1642)","12-26":"Mao Zedong (1893)","12-27":"Louis Pasteur (1822)","12-28":"Woodrow Wilson (1856)","12-29":"Andrew Johnson (1808)","12-30":"Rudyard Kipling (1865)","12-31":"Henri Matisse (1869)"};

const SIGNS={Aries:{sym:"\u2648",el:"fire",ruler:"Mars",dates:"Mar 21 \u2013 Apr 19",tag:"The Starter",line:"You don't need permission. You never did.",reading:"You move first. While everyone else weighs options, you've already decided. That's not recklessness \u2014 it's instinctive trust in your own judgment.",love:"You need someone who can match your intensity without trying to tame it.",career:"Born leader. You thrive where you can pioneer, not follow.",st:["Courageous","Confident","Determined"],wk:["Impatient","Aggressive","Impulsive"]},Taurus:{sym:"\u2649",el:"earth",ruler:"Venus",dates:"Apr 20 \u2013 May 20",tag:"The Builder",line:"You build empires. Slowly. Deliberately. Permanently.",reading:"While others chase trends, you invest in foundations. Your patience isn't passive \u2014 it's strategic. You know that real value takes time.",love:"You show love through consistency and physical presence. Touch is your language.",career:"You excel where persistence pays dividends. Finance, art, real estate.",st:["Reliable","Patient","Devoted"],wk:["Stubborn","Possessive","Materialistic"]},Gemini:{sym:"\u264A",el:"air",ruler:"Mercury",dates:"May 21 \u2013 Jun 20",tag:"The Mirror",line:"You contain multitudes. And yes, they all talk at once.",reading:"Your mind processes reality at twice the speed of everyone else. That's not scattered \u2014 it's parallel processing.",love:"You need intellectual stimulation first. Physical attraction follows mental connection.",career:"Communication, media, teaching, sales \u2014 anywhere ideas need translating.",st:["Versatile","Curious","Witty"],wk:["Indecisive","Restless","Inconsistent"]},Cancer:{sym:"\u264B",el:"water",ruler:"Moon",dates:"Jun 21 \u2013 Jul 22",tag:"The Sanctuary",line:"You feel everything. That's not weakness. That's your radar.",reading:"Your emotional intelligence is your superpower. You read rooms, sense shifts, and know who's lying before they finish the sentence.",love:"You love fiercely and protectively. Your home is your love letter to your partner.",career:"Caregiving, counseling, hospitality, real estate \u2014 creating safety.",st:["Loyal","Protective","Intuitive"],wk:["Moody","Clingy","Oversensitive"]},Leo:{sym:"\u264C",el:"fire",ruler:"Sun",dates:"Jul 23 \u2013 Aug 22",tag:"The Luminary",line:"You weren't born to fit in. You were born to stand out.",reading:"Your confidence isn't arrogance \u2014 it's solar energy. You warm every room you enter. People orbit you because you make them feel seen.",love:"You need to be adored, and you'll worship the right person in return.",career:"Performance, leadership, entertainment, entrepreneurship.",st:["Creative","Generous","Charismatic"],wk:["Arrogant","Dramatic","Attention-seeking"]},Virgo:{sym:"\u264D",el:"earth",ruler:"Mercury",dates:"Aug 23 \u2013 Sep 22",tag:"The Analyst",line:"You see what everyone else misses. Every single time.",reading:"Your attention to detail isn't obsession \u2014 it's precision. You improve everything you touch because you genuinely can't help it.",love:"Acts of service is your love language. You fix things for the people you love.",career:"Analysis, healthcare, editing, systems design \u2014 optimizing everything.",st:["Analytical","Reliable","Hardworking"],wk:["Overcritical","Worrier","Perfectionist"]},Libra:{sym:"\u264E",el:"air",ruler:"Venus",dates:"Sep 23 \u2013 Oct 22",tag:"The Diplomat",line:"You see both sides. That's not indecision. That's wisdom.",reading:"Your gift for balance makes you the person everyone trusts to be fair. You create beauty and harmony wherever you go.",love:"Partnership is your art form. You need someone who matches your emotional sophistication.",career:"Law, design, mediation, diplomacy \u2014 creating fairness and beauty.",st:["Diplomatic","Fair","Cooperative"],wk:["Indecisive","Avoidant","People-pleasing"]},Scorpio:{sym:"\u264F",el:"water",ruler:"Pluto",dates:"Oct 23 \u2013 Nov 21",tag:"The Alchemist",line:"You don't do surface level. About anything. Ever.",reading:"Your intensity isn't a flaw \u2014 it's your fuel. You transform pain into power and secrets into strategy.",love:"All or nothing. You need soul-deep connection or you'd rather be alone.",career:"Research, psychology, investigation, finance \u2014 uncovering hidden truth.",st:["Determined","Passionate","Loyal"],wk:["Jealous","Secretive","Controlling"]},Sagittarius:{sym:"\u2650",el:"fire",ruler:"Jupiter",dates:"Nov 22 \u2013 Dec 21",tag:"The Explorer",line:"You weren't meant to stay in one place. Physically or mentally.",reading:"Your restlessness isn't flightiness \u2014 it's a hunger for truth. You need to experience everything firsthand.",love:"You need a partner who's also your travel companion and debate opponent.",career:"Travel, education, philosophy, publishing \u2014 expanding horizons.",st:["Adventurous","Honest","Optimistic"],wk:["Blunt","Restless","Irresponsible"]},Capricorn:{sym:"\u2651",el:"earth",ruler:"Saturn",dates:"Dec 22 \u2013 Jan 19",tag:"The Architect",line:"You play the long game. And you always win it.",reading:"Your ambition isn't cold \u2014 it's focused. While others celebrate small wins, you're building something that lasts generations.",love:"You show love through providing and protecting. You need a partner who respects your drive.",career:"Management, finance, law, engineering \u2014 building lasting structures.",st:["Disciplined","Ambitious","Responsible"],wk:["Pessimistic","Rigid","Workaholic"]},Aquarius:{sym:"\u2652",el:"air",ruler:"Uranus",dates:"Jan 20 \u2013 Feb 18",tag:"The Visionary",line:"You see the future. That's why the present frustrates you.",reading:"Your independence isn't aloofness \u2014 it's intellectual sovereignty. You think in systems while others think in moments.",love:"You need mental freedom within commitment. Possessiveness kills your spark.",career:"Technology, activism, innovation, science \u2014 changing systems.",st:["Independent","Innovative","Humanitarian"],wk:["Detached","Unpredictable","Stubborn"]},Pisces:{sym:"\u2653",el:"water",ruler:"Neptune",dates:"Feb 19 \u2013 Mar 20",tag:"The Mystic",line:"You absorb the world's emotions. It's exhausting and beautiful.",reading:"Your sensitivity isn't fragility \u2014 it's a direct line to the collective unconscious. You know things you can't explain.",love:"You love unconditionally and need someone who won't exploit your softness.",career:"Art, healing, music, spirituality \u2014 channeling the invisible.",st:["Compassionate","Artistic","Intuitive"],wk:["Escapist","Oversensitive","Idealistic"]}};

const EL={fire:{name:"Fire",icon:"\u{1F525}",color:"#EF4444"},earth:{name:"Earth",icon:"\u{1F33F}",color:"#22C55E"},air:{name:"Air",icon:"\u{1F4A8}",color:"#60A5FA"},water:{name:"Water",icon:"\u{1F30A}",color:"#A78BFA"}};

const PI={sun:{n:"Sun",i:"\u2609",d:"Core identity"},moon:{n:"Moon",i:"\u263D",d:"Emotions & inner self"},rising:{n:"Rising",i:"\u2B06",d:"How others see you"},mercury:{n:"Mercury",i:"\u263F",d:"Communication style"},venus:{n:"Venus",i:"\u2640",d:"Love & beauty"},mars:{n:"Mars",i:"\u2642",d:"Action & drive"},jupiter:{n:"Jupiter",i:"\u2643",d:"Growth & luck"},saturn:{n:"Saturn",i:"\u2644",d:"Discipline & lessons"}};

const COMPAT={"Aries-Aries":[75,"Electric but combustible"],"Aries-Taurus":[62,"Passion vs patience"],"Aries-Gemini":[83,"Never a dull moment"],"Aries-Cancer":[55,"Bold meets tender"],"Aries-Leo":[90,"Royal power couple"],"Aries-Virgo":[52,"Impulse meets analysis"],"Aries-Libra":[72,"Action meets harmony"],"Aries-Scorpio":[68,"Mars-ruled passion"],"Aries-Sagittarius":[93,"Born to explore together"],"Aries-Capricorn":[58,"Both want to lead"],"Aries-Aquarius":[80,"Innovation meets action"],"Aries-Pisces":[60,"Steam or sizzle"],"Taurus-Taurus":[85,"Stable and sensual"],"Taurus-Gemini":[48,"Steady meets scattered"],"Taurus-Cancer":[92,"Domestic bliss"],"Taurus-Leo":[65,"Luxury lovers"],"Taurus-Virgo":[90,"Practical perfection"],"Taurus-Libra":[70,"Venus-ruled beauties"],"Taurus-Scorpio":[78,"Possessive passion"],"Taurus-Sagittarius":[45,"Homebody vs wanderer"],"Taurus-Capricorn":[95,"Empire builders"],"Taurus-Aquarius":[42,"Traditional vs radical"],"Taurus-Pisces":[87,"Gentle and devoted"],"Gemini-Gemini":[72,"Never boring"],"Gemini-Cancer":[55,"Mind meets heart"],"Gemini-Leo":[82,"Life of the party"],"Gemini-Virgo":[60,"Mercury minds"],"Gemini-Libra":[88,"Intellectual romance"],"Gemini-Scorpio":[50,"Fascination or friction"],"Gemini-Sagittarius":[80,"Mental explorers"],"Gemini-Capricorn":[45,"Free spirit vs structure"],"Gemini-Aquarius":[92,"Cosmic connection"],"Gemini-Pisces":[52,"Ever-shifting"],"Cancer-Cancer":[82,"Emotionally deep"],"Cancer-Leo":[70,"Devotion and drama"],"Cancer-Virgo":[85,"Quietly perfect"],"Cancer-Libra":[52,"Different priorities"],"Cancer-Scorpio":[94,"Soul-level bond"],"Cancer-Sagittarius":[42,"Nest vs nomad"],"Cancer-Capricorn":[78,"Tradition and security"],"Cancer-Aquarius":[48,"Emotion vs detachment"],"Cancer-Pisces":[95,"Emotional paradise"],"Leo-Leo":[72,"Magnificent but competitive"],"Leo-Virgo":[58,"Humble meets proud"],"Leo-Libra":[85,"Charm and charisma"],"Leo-Scorpio":[68,"Power struggles"],"Leo-Sagittarius":[92,"Boundless enthusiasm"],"Leo-Capricorn":[55,"Royalty meets CEO"],"Leo-Aquarius":[75,"Creative tension"],"Leo-Pisces":[62,"Art and heart"],"Virgo-Virgo":[78,"Efficient love"],"Virgo-Libra":[62,"Beauty and precision"],"Virgo-Scorpio":[85,"Deeply loyal"],"Virgo-Sagittarius":[48,"Detail vs big picture"],"Virgo-Capricorn":[92,"Goals and growth"],"Virgo-Aquarius":[50,"Method meets madness"],"Virgo-Pisces":[80,"Practical meets mystical"],"Libra-Libra":[75,"Beautiful but indecisive"],"Libra-Scorpio":[62,"Charm meets intensity"],"Libra-Sagittarius":[82,"Fun-loving pair"],"Libra-Capricorn":[55,"Different styles"],"Libra-Aquarius":[90,"Intellectual bliss"],"Libra-Pisces":[58,"Dreamy but unfocused"],"Scorpio-Scorpio":[72,"All or nothing"],"Scorpio-Sagittarius":[55,"Depth meets breadth"],"Scorpio-Capricorn":[88,"Unstoppable ambition"],"Scorpio-Aquarius":[52,"Stubborn standoffs"],"Scorpio-Pisces":[92,"Psychic connection"],"Sagittarius-Sagittarius":[80,"Wanderlust squared"],"Sagittarius-Capricorn":[52,"Free vs structured"],"Sagittarius-Aquarius":[88,"Independent together"],"Sagittarius-Pisces":[60,"Optimistic chaos"],"Capricorn-Capricorn":[82,"Serious and solid"],"Capricorn-Aquarius":[55,"Old meets new"],"Capricorn-Pisces":[78,"Dreams with plans"],"Aquarius-Aquarius":[75,"Unique bond"],"Aquarius-Pisces":[60,"Visionary meets mystic"],"Pisces-Pisces":[78,"Deeply spiritual"]};
const getCompat=(a,b)=>COMPAT[a+"-"+b]||COMPAT[b+"-"+a]||[50,"Unique pairing"];

const MO=["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAILY=["That thing you've been putting off? You're afraid of what changes when you do it.","You've been performing a version of yourself others are comfortable with.","Someone in your life is taking more than they give.","You're overthinking it because you already know the answer.","You're not stuck. You're choosing safety over growth.","The person you were three years ago would be proud.","Stop waiting for someone to validate the decision you already made.","Your gut has been right the whole time.","That conversation you keep replaying? They forgot weeks ago.","You don't need more information. You need more courage.","One uncomfortable conversation separates here from there.","The comfort zone has a cost you're pretending not to see.","You're overcomplicating it because the simple answer scares you.","The relationship you need most right now is with yourself.","You keep attracting the same pattern because you haven't changed what you tolerate."];

const getSign=(m,d)=>{const Z=[["Capricorn",1,19],["Aquarius",2,18],["Pisces",3,20],["Aries",4,19],["Taurus",5,20],["Gemini",6,20],["Cancer",7,22],["Leo",8,22],["Virgo",9,22],["Libra",10,22],["Scorpio",11,21],["Sagittarius",12,21],["Capricorn",12,31]];for(let i=Z.length-1;i>=0;i--)if(m>Z[i][1]||(m===Z[i][1]&&d>=([0,20,19,21,20,21,21,23,23,23,23,22,22][Z[i][1]]||1)))return Z[i][0];return"Capricorn"};
const citySearch=q=>{if(!q||q.length<2)return[];const s=q.toLowerCase().trim(),ks=Object.keys(CITIES);return[...ks.filter(k=>k.startsWith(s)),...ks.filter(k=>!k.startsWith(s)&&k.includes(s))].slice(0,8)};
const fmtCity=c=>c.split(",").map(p=>p.trim().replace(/\b\w/g,l=>l.toUpperCase())).join(", ");
const getBday=(m,d)=>{const k=m+"-"+d;return(typeof BDAYS!=="undefined")?BDAYS[k]||null:null};
const getHist=(m,d)=>{const k=m+"-"+d;return(typeof HIST!=="undefined")?HIST[k]||null:null};

// STYLES
const F="'Outfit',sans-serif";
const C={bg:"#0D1117",card:"#161B22",soft:"#1C2333",pri:"#58A6FF",acc:"#79C0FF",tx:"#E6EDF3",med:"#8B949E",dim:"#484F58",bor:"#30363D",grn:"#3FB950",red:"#F85454",gold:"#F5A623"};
const sCard={background:C.card,borderRadius:14,padding:"20px 16px",border:"1px solid "+C.bor,marginBottom:12};
const sSoft={background:C.soft,borderRadius:10,padding:12,border:"1px solid "+C.bor};
const sBtn={fontFamily:F,fontWeight:600,border:"none",cursor:"pointer",borderRadius:10,background:C.pri,color:C.bg,padding:"12px 22px",fontSize:13,width:"100%"};
const sSel={fontFamily:F,fontSize:13,padding:"10px 12px",borderRadius:8,border:"1.5px solid "+C.bor,background:C.soft,color:C.tx,outline:"none",flex:1,minHeight:40,appearance:"auto"};
const sInp={fontFamily:F,fontSize:13,padding:"10px 12px",borderRadius:8,border:"1.5px solid "+C.bor,background:C.soft,color:C.tx,outline:"none",width:"100%",boxSizing:"border-box"};
const sLbl={fontFamily:F,fontSize:10,fontWeight:600,letterSpacing:".12em",textTransform:"uppercase",color:C.dim,marginBottom:6};
const sTag=c=>({fontFamily:F,fontSize:10,fontWeight:600,background:(c||C.pri)+"15",color:c||C.pri,padding:"3px 9px",borderRadius:6,border:"1px solid "+(c||C.pri)+"25",display:"inline-block"});

const CityInput=memo(({inputRef})=>{
  const[q,setQ]=useState("");const[res,setRes]=useState([]);const[show,setShow]=useState(false);const wr=useRef(null);
  useEffect(()=>{const h=e=>{if(wr.current&&!wr.current.contains(e.target))setShow(false)};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h)},[]);
  return <div ref={wr} style={{position:"relative"}}>
    <input value={q} onChange={e=>{const v=e.target.value;setQ(v);if(inputRef)inputRef.current=v;setRes(citySearch(v));setShow(v.length>=2)}} placeholder="City (100+ US cities)" style={sInp}/>
    {show&&res.length>0&&<div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:50,background:C.card,border:"1px solid "+C.bor,borderRadius:8,marginTop:4,maxHeight:200,overflowY:"auto"}}>{res.map(c=><div key={c} onClick={()=>{setQ(fmtCity(c));if(inputRef)inputRef.current=fmtCity(c);setShow(false)}} style={{padding:"8px 12px",fontFamily:F,fontSize:12,color:C.tx,cursor:"pointer",borderBottom:"1px solid "+C.bor+"30"}}>{fmtCity(c)}</div>)}</div>}
  </div>;
});

export default function BloomOracle(){
  const[view,setView]=useState("home");
  const[user,setUser]=useState(null);
  const[auth,setAuth]=useState(false);
  const[rd,setRd]=useState(null);
  const[rl,setRl]=useState(false);
  const[cp,setCp]=useState(null);
  const[partner,setPartner]=useState("");
  const[cl,setCl]=useState(false);
  const[aiH,setAiH]=useState(null);
  const[aiL,setAiL]=useState(false);
  const[lSign,setLSign]=useState(null);
  const[reviews,setReviews]=useState([{n:"Maya T.",r:5,t:"My birthday reading was eerily accurate.",d:"2d"},{n:"Jordan K.",r:5,t:"The compatibility explained my relationship perfectly.",d:"5d"},{n:"Aisha R.",r:4,t:"Finally an astrology app that asks for birth TIME.",d:"1w"},{n:"Carlos M.",r:5,t:"Every day of the year has a unique reading. Next level.",d:"1w"},{n:"Priya S.",r:5,t:"I have used Co-Star and The Pattern. This goes deeper.",d:"2w"}]);
  const[rvNm,setRvNm]=useState("");const[rvTx,setRvTx]=useState("");const[rvRt,setRvRt]=useState(5);
  const rmo=useRef("");const rdy=useRef("");const ryr=useRef("");const rhr=useRef("12");const rap=useRef("PM");const rloc=useRef("");
  const[aNm,setANm]=useState("");const[aMo,setAMo]=useState("");const[aDy,setADy]=useState("");const[aYr,setAYr]=useState("");const[aHr,setAHr]=useState("12");const[aAp,setAAp]=useState("PM");const acity=useRef("");

  const now=new Date();const curYear=now.getFullYear();
  const moon=useMemo(getMoonPhase,[]);
  const daily=DAILY[now.getDate()%DAILY.length];
  const todayBday=getBday(now.getMonth()+1,now.getDate());
  const todayHist=getHist(now.getMonth()+1,now.getDate());
  const uSign=user?SIGNS[user.signKey]:null;
  const go=v=>{setView(v);window.scrollTo({top:0,behavior:"instant"})};
  const star="\u2605";

  const doRead=()=>{
    if(!rmo.current||!rdy.current||!ryr.current)return;setRl(true);
    setTimeout(()=>{
      const mi=MO.indexOf(rmo.current)+1,d=+rdy.current,y=+ryr.current;
      let hr=+rhr.current;if(rap.current==="PM"&&hr!==12)hr+=12;if(rap.current==="AM"&&hr===12)hr=0;
      const loc=rloc.current?.toLowerCase().replace(/[,.\s]+/g," ").trim()||"";
      let lat=33.45,lng=-112.07;for(const[k,co]of Object.entries(CITIES)){if(k.replace(/,/g," ")===loc||loc.includes(k.split(",")[0])){lat=co[0];lng=co[1];break}}
      const ch=birthChart(y,mi,d,hr,lat,lng);const sKey=ch.sun.sign;
      setRd({sKey,ch,mi,d,y,bday:getBday(mi,d)});setRl(false);
    },800);
  };

  const doAuth=()=>{
    if(!aNm||!aMo||!aDy)return;
    const mi=MO.indexOf(aMo)+1,d=+aDy,y=+aYr||1990;
    let hr=+aHr;if(aAp==="PM"&&hr!==12)hr+=12;if(aAp==="AM"&&hr===12)hr=0;
    const loc=acity.current?.toLowerCase().replace(/[,.\s]+/g," ").trim()||"";
    let lat=33.45,lng=-112.07;for(const[k,co]of Object.entries(CITIES)){if(k.replace(/,/g," ")===loc||loc.includes(k.split(",")[0])){lat=co[0];lng=co[1];break}}
    const ch=birthChart(y,mi,d,hr,lat,lng);
    setUser({name:aNm.trim(),signKey:ch.sun.sign,chart:ch,bday:getBday(mi,d),mo:mi,dy:d});
    setAuth(false);
  };

  const loadAI=async()=>{
    if(!user||aiL)return;setAiL(true);
    try{
      const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:800,messages:[{role:"user",content:"You are Birth Chart Path, a gifted astrologer. Write a personalized daily horoscope for "+user.name+" (Sun "+user.signKey+", Moon "+user.chart.moon.sign+", Rising "+user.chart.rising.sign+"). Moon phase: "+moon.name+" "+moon.pct+"%. Be direct, insightful, psychological. 3 paragraphs under 200 words."}]})});
      const j=await r.json();setAiH(j.content?.map(b=>b.text||"").join("")||"The stars are aligning for you today.");
    }catch{setAiH("Your cosmic energy is powerful today. Trust your "+user.signKey+" intuition.")}
    setAiL(false);
  };

  const css="@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}body{margin:0;overflow-x:hidden}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#30363D;border-radius:2px}select{color-scheme:dark}input::placeholder{color:#484F58}button{transition:transform 80ms}button:active{transform:scale(.97)}@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.fade{animation:fadeIn .3s ease both}";

  return <div style={{background:C.bg,minHeight:"100vh",color:C.tx,position:"relative"}}>
    <style>{css}</style>

    {/* TOP NAV */}
    <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:100,height:52,background:C.bg+"EE",backdropFilter:"blur(16px)",borderBottom:"1px solid "+C.bor,padding:"0 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer"}} onClick={()=>go("home")}>
        <span style={{fontSize:16,color:C.pri}}>{"\u25C9"}</span>
        <span style={{fontFamily:F,fontSize:15,fontWeight:700,letterSpacing:"-.03em"}}>Birth Chart Path</span>
      </div>
      {user?<button onClick={()=>go("profile")} style={{background:C.soft,border:"1.5px solid "+C.bor,borderRadius:7,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontFamily:F,fontSize:11,fontWeight:700,color:C.tx}}>{user.name[0]}</button>
        :<button onClick={()=>setAuth(true)} style={{fontFamily:F,fontSize:12,fontWeight:600,background:C.pri,color:C.bg,border:"none",borderRadius:8,padding:"7px 14px",cursor:"pointer"}}>Sign in</button>}
    </nav>

    {/* BOTTOM TABS */}
    <nav style={{position:"fixed",bottom:0,left:0,right:0,zIndex:100,background:C.bg+"F0",backdropFilter:"blur(16px)",borderTop:"1px solid "+C.bor,display:"flex",justifyContent:"space-around",padding:"5px 0 8px"}}>
      {[["home","Home"],["reading","Chart"],["learn","Learn"],["feedback","Reviews"],["membership","Grow"]].map(([v,l])=>
        <button key={v} onClick={()=>go(v)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:"none",border:"none",cursor:"pointer",padding:"5px 10px",opacity:view===v?1:.4}}>
          <span style={{fontFamily:F,fontSize:9,fontWeight:600,color:view===v?C.pri:C.dim}}>{l}</span>
        </button>
      )}
    </nav>

    <div style={{padding:"68px 16px 90px",maxWidth:480,margin:"0 auto"}}>

    {/* ===== HOME ===== */}
    {view==="home"&&<div className="fade">
      <div style={{padding:"28px 0 20px",textAlign:"center"}}>
        <div style={{fontFamily:F,fontSize:10,fontWeight:600,letterSpacing:".15em",textTransform:"uppercase",color:C.dim,marginBottom:8}}>{moon.icon+" "+moon.name+" \u00B7 "+moon.pct+"% illuminated"}</div>
        <h1 style={{fontFamily:F,fontSize:"clamp(21px,6.5vw,27px)",fontWeight:700,lineHeight:1.2,margin:"0 0 8px",letterSpacing:"-.04em"}}>Your real birth chart.<br/>366 unique birthday readings.</h1>
        <p style={{fontFamily:F,fontSize:13,color:C.med,lineHeight:1.5,margin:"0 auto 18px",maxWidth:360}}>Astronomical calculations. 100+ cities. Every day of the year has a unique personality.</p>
        <div style={{display:"flex",justifyContent:"center",gap:10,flexWrap:"wrap"}}>
          <button style={{...sBtn,width:"auto",padding:"12px 22px"}} onClick={()=>go("reading")}>Calculate your chart</button>
          {!user&&<button onClick={()=>setAuth(true)} style={{fontFamily:F,fontWeight:600,border:"1px solid "+C.pri+"25",cursor:"pointer",borderRadius:10,background:"transparent",color:C.pri,padding:"12px 22px",fontSize:13}}>Sign in</button>}
        </div>
      </div>

      {/* Today's Birthday */}
      {todayBday&&<div style={{...sCard,background:"linear-gradient(135deg,"+C.card+" 0%,#1a1f2e 100%)"}}>
        <div style={sLbl}>{"Today's Birthday Personality"}</div>
        <h3 style={{fontFamily:F,fontSize:16,fontWeight:700,color:C.gold,margin:"4px 0 6px"}}>{todayBday}</h3>
        <div style={{fontFamily:F,fontSize:10,color:C.dim,marginTop:4}}>{now.toLocaleDateString("en-US",{month:"long",day:"numeric"})}</div>
      </div>}

      {/* Born Today */}
      {todayHist&&<div style={sCard}>
        <div style={sLbl}>{"\u2B50 Born Today"}</div>
        <div style={{fontFamily:F,fontSize:13,color:C.tx}}>{todayHist}</div>
      </div>}

      {/* User card */}
      {user&&uSign&&<div style={{...sCard,boxShadow:"0 0 20px rgba(88,166,255,0.08)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
          <span style={{fontSize:24}}>{uSign.sym}</span>
          <div>
            <div style={{fontFamily:F,fontSize:14,fontWeight:700}}>{user.name+" \u2014 "+user.signKey}</div>
            <div style={{fontFamily:F,fontSize:11,color:C.med}}>{uSign.tag}</div>
          </div>
        </div>
        <div style={sSoft}><p style={{fontFamily:F,fontSize:13,lineHeight:1.55,margin:0}}>{uSign.line}</p></div>
        {user.bday&&<div style={{marginTop:8,padding:"8px 12px",background:C.gold+"08",borderRadius:8,border:"1px solid "+C.gold+"20"}}>
          <div style={{fontFamily:F,fontSize:10,fontWeight:600,color:C.gold}}>Your Birthday: {user.bday}</div>
        </div>}
      </div>}

      {/* Daily Insight */}
      <div style={{...sCard,cursor:cl?"default":"pointer"}} onClick={()=>{if(!cl)setCl(true)}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:42,height:42,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",background:cl?C.soft:C.pri,fontSize:18,color:cl?C.dim:C.bg}}>{cl?"\u2713":"\u25C9"}</div>
          <div>
            <div style={{fontFamily:F,fontSize:13,fontWeight:700}}>{cl?"Claimed":"Daily insight ready"}</div>
            <div style={{fontFamily:F,fontSize:11,color:C.med}}>{cl?"+50 XP":"Tap to collect"}</div>
          </div>
        </div>
      </div>

      <div style={sCard}><div style={sLbl}>Today</div><p style={{fontFamily:F,fontSize:14,lineHeight:1.55,margin:"4px 0 0"}}>{daily}</p></div>

      {/* Moon Phase */}
      <div style={sCard}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{fontSize:32}}>{moon.icon}</div>
          <div style={{flex:1}}>
            <div style={{fontFamily:F,fontSize:13,fontWeight:700}}>{moon.name}</div>
            <div style={{fontFamily:F,fontSize:11,color:C.med}}>{moon.msg}</div>
            <div style={{fontFamily:F,fontSize:10,color:C.dim,marginTop:2}}>{"Day "+moon.day+" of 29.5 \u00B7 New moon in "+moon.next+" days"}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:F,fontSize:18,fontWeight:800,color:C.pri}}>{moon.pct+"%"}</div>
            <div style={{fontFamily:F,fontSize:9,color:C.dim}}>illuminated</div>
          </div>
        </div>
      </div>

      {/* Zodiac Grid */}
      <div style={sCard}>
        <div style={sLbl}>The Zodiac</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
          {Object.entries(SIGNS).map(([k,s])=>
            <div key={k} onClick={()=>{setLSign(k);go("learn")}} style={{textAlign:"center",padding:"10px 4px",borderRadius:8,background:EL[s.el].color+"08",border:"1px solid "+EL[s.el].color+"15",cursor:"pointer"}}>
              <div style={{fontSize:18}}>{s.sym}</div>
              <div style={{fontFamily:F,fontSize:10,fontWeight:600}}>{k}</div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Preview */}
      <div style={sCard}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={sLbl}>Community reviews</div>
          <button onClick={()=>go("feedback")} style={{fontFamily:F,fontSize:10,color:C.pri,background:"none",border:"none",cursor:"pointer"}}>See all</button>
        </div>
        {reviews.slice(0,2).map((rv,i)=>
          <div key={i} style={{...sSoft,marginBottom:6}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
              <span style={{fontFamily:F,fontSize:11,fontWeight:700}}>{rv.n}</span>
              <span style={{fontFamily:F,fontSize:10,color:C.gold}}>{star.repeat(rv.r)}</span>
            </div>
            <p style={{fontFamily:F,fontSize:11,color:C.med,lineHeight:1.4,margin:0}}>{rv.t}</p>
          </div>
        )}
      </div>
    </div>}

    {/* ===== CHART ===== */}
    {view==="reading"&&<div className="fade">
      <div style={{...sCard,boxShadow:"0 0 20px rgba(88,166,255,0.08)"}}>
        <h2 style={{fontFamily:F,fontSize:20,fontWeight:700,margin:"0 0 4px"}}>Your real birth chart.</h2>
        <p style={{fontFamily:F,fontSize:12,color:C.med,margin:"0 0 14px"}}>Astronomical algorithms + your unique birthday personality.</p>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <select defaultValue="" onChange={e=>{rmo.current=e.target.value}} style={sSel}><option value="">Month</option>{MO.map(m=><option key={m}>{m}</option>)}</select>
          <select defaultValue="" onChange={e=>{rdy.current=e.target.value}} style={sSel}><option value="">Day</option>{Array.from({length:31},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select>
        </div>
        <select defaultValue="" onChange={e=>{ryr.current=e.target.value}} style={{...sSel,width:"100%",flex:"none",marginBottom:8}}><option value="">Year born</option>{Array.from({length:curYear-1929},(_,i)=>curYear-i).map(y=><option key={y} value={y}>{y}</option>)}</select>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <select defaultValue="12" onChange={e=>{rhr.current=e.target.value}} style={sSel}>{Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select>
          <select defaultValue="PM" onChange={e=>{rap.current=e.target.value}} style={{...sSel,maxWidth:80}}><option value="AM">AM</option><option value="PM">PM</option></select>
        </div>
        <CityInput inputRef={rloc}/>
        <p style={{fontFamily:F,fontSize:9,color:C.dim,margin:"6px 0 12px"}}>Birth time affects Rising sign.</p>
        <button style={sBtn} onClick={doRead} disabled={rl}>{rl?"Computing planetary positions...":"Calculate birth chart"}</button>
        {rl&&<div style={{textAlign:"center",marginTop:14}}><div style={{width:22,height:22,border:"2.5px solid "+C.bor,borderTopColor:C.pri,borderRadius:"50%",animation:"spin .7s linear infinite",margin:"0 auto"}}/></div>}
      </div>

      {rd&&!rl&&<div className="fade">
        {rd.bday&&<div style={{...sCard,background:"linear-gradient(135deg,"+C.card+" 0%,#1a1f2e 100%)"}}>
          <div style={sLbl}>{"Your Birthday Personality \u00B7 "+MO[rd.mi-1]+" "+rd.d}</div>
          <h3 style={{fontFamily:F,fontSize:18,fontWeight:700,color:C.gold,margin:"4px 0"}}>{rd.bday}</h3>
        </div>}
        <div style={{...sCard,boxShadow:"0 0 20px rgba(88,166,255,0.08)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <span style={{fontSize:28}}>{SIGNS[rd.sKey].sym}</span>
            <div>
              <h3 style={{fontFamily:F,fontSize:18,fontWeight:700,margin:0}}>{SIGNS[rd.sKey].tag}</h3>
              <div style={{display:"flex",gap:5,marginTop:3,flexWrap:"wrap"}}>
                <span style={sTag()}>{SIGNS[rd.sKey].sym+" "+rd.sKey}</span>
                <span style={sTag(EL[SIGNS[rd.sKey].el].color)}>{EL[SIGNS[rd.sKey].el].icon+" "+EL[SIGNS[rd.sKey].el].name}</span>
                <span style={sTag(C.acc)}>{SIGNS[rd.sKey].ruler}</span>
              </div>
            </div>
          </div>
          <div style={sSoft}>
            <p style={{fontFamily:F,fontSize:14,fontWeight:500,fontStyle:"italic",lineHeight:1.6,margin:"0 0 8px"}}>{SIGNS[rd.sKey].line}</p>
            <p style={{fontFamily:F,fontSize:13,lineHeight:1.65,margin:0}}>{SIGNS[rd.sKey].reading}</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:12}}>
            <div style={sSoft}><div style={sLbl}>In Love</div><p style={{fontFamily:F,fontSize:11,color:C.med,lineHeight:1.45,margin:0}}>{SIGNS[rd.sKey].love}</p></div>
            <div style={sSoft}><div style={sLbl}>At Work</div><p style={{fontFamily:F,fontSize:11,color:C.med,lineHeight:1.45,margin:0}}>{SIGNS[rd.sKey].career}</p></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}>
            <div style={sSoft}><div style={sLbl}>Strengths</div>{SIGNS[rd.sKey].st.map((t,i)=><div key={i} style={{fontFamily:F,fontSize:11,padding:"2px 0"}}>{t}</div>)}</div>
            <div style={sSoft}><div style={sLbl}>Weaknesses</div>{SIGNS[rd.sKey].wk.map((t,i)=><div key={i} style={{fontFamily:F,fontSize:11,color:C.med,padding:"2px 0"}}>{t}</div>)}</div>
          </div>
        </div>
        <div style={sCard}>
          <div style={sLbl}>Complete Birth Chart</div>
          {Object.entries(PI).map(([k,p])=>{const pl=rd.ch[k];if(!pl)return null;const s=SIGNS[pl.sign];const e=EL[s?.el]||EL.fire;return <div key={k} style={{background:e.color+"06",borderRadius:10,padding:12,border:"1px solid "+e.color+"15",marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:16}}>{p.i}</span>
              <span style={{fontFamily:F,fontSize:13,fontWeight:700}}>{p.n+" in "+pl.sign}</span>
              <span style={{fontFamily:F,fontSize:10,color:C.dim}}>{pl.deg+"\u00B0"+pl.min+"'"}</span>
            </div>
          </div>})}
        </div>
      </div>}

      {/* Compatibility */}
      <div style={sCard}>
        <h3 style={{fontFamily:F,fontSize:17,fontWeight:700,margin:"0 0 12px"}}>Check compatibility.</h3>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:12}}>
          {Object.entries(SIGNS).map(([k,s])=>
            <button key={k} onClick={()=>setPartner(k)} style={{padding:"8px 4px",background:partner===k?C.pri+"20":C.soft,border:partner===k?"1px solid "+C.pri:"1px solid "+C.bor,borderRadius:8,cursor:"pointer",textAlign:"center",color:C.tx}}>
              <div style={{fontSize:16}}>{s.sym}</div>
              <div style={{fontFamily:F,fontSize:8,color:partner===k?C.pri:C.dim}}>{k}</div>
            </button>
          )}
        </div>
        {partner&&rd&&(()=>{const c=getCompat(rd.sKey,partner);return <div className="fade" style={{textAlign:"center",padding:12}}>
          <div style={{fontFamily:F,fontSize:38,fontWeight:800,color:c[0]>=80?C.grn:c[0]>=60?C.pri:C.red}}>{c[0]+"%"}</div>
          <div style={{fontFamily:F,fontSize:14,fontWeight:600,marginBottom:8}}>{c[1]}</div>
          <div style={{display:"flex",justifyContent:"center",gap:8}}>
            <span style={sTag()}>{SIGNS[rd.sKey].sym+" "+rd.sKey}</span>
            <span style={sTag(C.acc)}>{SIGNS[partner].sym+" "+partner}</span>
          </div>
        </div>})()}
      </div>
    </div>}

    {/* ===== LEARN ===== */}
    {view==="learn"&&<div className="fade">
      <h2 style={{fontFamily:F,fontSize:20,fontWeight:700,margin:"0 0 14px"}}>Learn astrology.</h2>
      {lSign&&(()=>{const s=SIGNS[lSign],el=EL[s.el];return <div style={sCard}>
        <button onClick={()=>setLSign(null)} style={{fontFamily:F,fontSize:11,color:C.pri,background:"none",border:"none",cursor:"pointer",marginBottom:10}}>{"\u2190 All signs"}</button>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
          <span style={{fontSize:32}}>{s.sym}</span>
          <div>
            <h3 style={{fontFamily:F,fontSize:20,fontWeight:700,margin:0}}>{lSign}</h3>
            <div style={{display:"flex",gap:4,marginTop:3,flexWrap:"wrap"}}>
              <span style={sTag(el.color)}>{el.icon+" "+el.name}</span>
              <span style={sTag(C.acc)}>{s.ruler}</span>
            </div>
          </div>
        </div>
        <p style={{fontFamily:F,fontSize:14,fontWeight:500,fontStyle:"italic",lineHeight:1.6,margin:"0 0 8px"}}>{s.line}</p>
        <p style={{fontFamily:F,fontSize:13,lineHeight:1.65,margin:"0 0 12px"}}>{s.reading}</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
          <div style={sSoft}><div style={sLbl}>In Love</div><p style={{fontFamily:F,fontSize:11,color:C.med,lineHeight:1.45,margin:0}}>{s.love}</p></div>
          <div style={sSoft}><div style={sLbl}>At Work</div><p style={{fontFamily:F,fontSize:11,color:C.med,lineHeight:1.45,margin:0}}>{s.career}</p></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div style={sSoft}><div style={sLbl}>Strengths</div>{s.st.map((t,i)=><div key={i} style={{fontFamily:F,fontSize:11,padding:"2px 0"}}>{t}</div>)}</div>
          <div style={sSoft}><div style={sLbl}>Weaknesses</div>{s.wk.map((t,i)=><div key={i} style={{fontFamily:F,fontSize:11,color:C.med,padding:"2px 0"}}>{t}</div>)}</div>
        </div>
      </div>})()}
      {!lSign&&<>
        <div style={sCard}>
          <div style={sLbl}>The 12 Signs</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
            {Object.entries(SIGNS).map(([k,s])=>
              <div key={k} onClick={()=>setLSign(k)} style={{textAlign:"center",padding:"12px 6px",borderRadius:10,background:EL[s.el].color+"06",border:"1px solid "+EL[s.el].color+"15",cursor:"pointer"}}>
                <div style={{fontSize:22}}>{s.sym}</div>
                <div style={{fontFamily:F,fontSize:11,fontWeight:700}}>{k}</div>
                <div style={{fontFamily:F,fontSize:9,color:C.dim}}>{s.tag}</div>
              </div>
            )}
          </div>
        </div>
        <div style={sCard}>
          <div style={sLbl}>The Planets</div>
          {Object.entries(PI).map(([k,p])=>
            <div key={k} style={{...sSoft,display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
              <span style={{fontSize:18}}>{p.i}</span>
              <div>
                <div style={{fontFamily:F,fontSize:12,fontWeight:700}}>{p.n}</div>
                <div style={{fontFamily:F,fontSize:10,color:C.med}}>{p.d}</div>
              </div>
            </div>
          )}
        </div>
      </>}
    </div>}

    {/* ===== REVIEWS ===== */}
    {view==="feedback"&&<div className="fade">
      <h2 style={{fontFamily:F,fontSize:20,fontWeight:700,margin:"0 0 14px"}}>Community reviews.</h2>
      <div style={sCard}>
        <div style={sLbl}>Write a review</div>
        <input value={rvNm} onChange={e=>setRvNm(e.target.value)} placeholder="Your name" style={{...sInp,marginBottom:8}}/>
        <div style={{display:"flex",gap:4,marginBottom:8}}>{[1,2,3,4,5].map(s=><button key={s} onClick={()=>setRvRt(s)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",opacity:s<=rvRt?1:.3,padding:0,color:C.gold}}>{star}</button>)}</div>
        <textarea value={rvTx} onChange={e=>setRvTx(e.target.value)} placeholder="What was your experience?" style={{...sInp,minHeight:70,resize:"vertical",fontFamily:F}} rows={3}/>
        <button style={{...sBtn,marginTop:8}} onClick={()=>{if(!rvNm.trim()||!rvTx.trim())return;setReviews(rv=>[{n:rvNm.trim(),r:rvRt,t:rvTx.trim(),d:"Just now"},...rv]);setRvNm("");setRvTx("");setRvRt(5)}}>Submit review</button>
      </div>
      {reviews.map((rv,i)=>
        <div key={i} style={{...sSoft,marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
            <span style={{fontFamily:F,fontSize:12,fontWeight:700}}>{rv.n}</span>
            <span style={{fontFamily:F,fontSize:10,color:C.gold}}>{star.repeat(rv.r)}</span>
          </div>
          <p style={{fontFamily:F,fontSize:12,color:C.med,lineHeight:1.5,margin:0}}>{rv.t}</p>
        </div>
      )}
    </div>}

    {/* ===== GROW ===== */}
    {view==="membership"&&<div className="fade">
      <h2 style={{fontFamily:F,fontSize:20,fontWeight:700,margin:"0 0 4px"}}>Grow with Bloom.</h2>
      <p style={{fontFamily:F,fontSize:12,color:C.med,margin:"0 0 18px"}}>Premium gets AI-powered personalized horoscopes.</p>
      <div style={{...sCard,border:"1.5px solid "+C.gold+"40",background:"linear-gradient(135deg,"+C.card+" 0%,#1f1a14 100%)"}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
          <span style={{fontSize:14}}>{"\u2728"}</span>
          <span style={{fontFamily:F,fontSize:14,fontWeight:700,color:C.gold}}>AI Personalized Horoscope</span>
          <span style={sTag(C.gold)}>PREMIUM</span>
        </div>
        <p style={{fontFamily:F,fontSize:12,color:C.med,lineHeight:1.5,margin:"0 0 12px"}}>A daily reading written for YOUR birth chart, powered by AI.</p>
        {user?<button style={{...sBtn,background:C.gold,color:"#000"}} onClick={loadAI} disabled={aiL}>{aiL?"Generating your reading...":"Generate my horoscope"}</button>
          :<button style={{...sBtn,background:C.gold,color:"#000"}} onClick={()=>setAuth(true)}>Sign in to unlock</button>}
        {aiL&&<div style={{textAlign:"center",marginTop:12}}><div style={{width:22,height:22,border:"2.5px solid "+C.bor,borderTopColor:C.gold,borderRadius:"50%",animation:"spin .7s linear infinite",margin:"0 auto"}}/></div>}
        {aiH&&<div style={{...sSoft,marginTop:12}}><p style={{fontFamily:F,fontSize:13,lineHeight:1.6,margin:0,whiteSpace:"pre-wrap"}}>{aiH}</p></div>}
      </div>
      {[{t:"Monthly",p:"$8",per:"/mo",feat:["Real birth chart calculations","366 birthday personalities","AI daily horoscope","Unlimited compatibility"],rec:true},{t:"Annual",p:"$69",per:"/yr",feat:["Everything in Monthly","2 months free"],rec:false},{t:"Founding",p:"$5",per:"/mo forever",feat:["Everything in Annual","Locked rate forever","Founding badge"],rec:false}].map((plan,i)=>
        <div key={i} style={{...sCard,border:plan.rec?"1.5px solid "+C.pri:"1px solid "+C.bor}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:10}}>
            <span style={{fontFamily:F,fontSize:16,fontWeight:700}}>{plan.t}</span>
            <div><span style={{fontFamily:F,fontSize:22,fontWeight:800,color:C.pri}}>{plan.p}</span><span style={{fontFamily:F,fontSize:11,color:C.dim}}>{plan.per}</span></div>
          </div>
          {plan.feat.map((ft,j)=><div key={j} style={{fontFamily:F,fontSize:11,padding:"3px 0"}}><span style={{color:C.grn,marginRight:6}}>{"\u2713"}</span>{ft}</div>)}
          <button style={{...sBtn,marginTop:12,background:plan.rec?C.pri:C.pri+"10",color:plan.rec?C.bg:C.pri,border:plan.rec?"none":"1px solid "+C.pri+"25"}} onClick={()=>setAuth(true)}>Get started</button>
        </div>
      )}
    </div>}

    {/* ===== PROFILE ===== */}
    {view==="profile"&&user&&(()=>{const s=SIGNS[user.signKey],el=EL[s.el];return <div className="fade">
      <div style={{...sCard,boxShadow:"0 0 20px rgba(88,166,255,0.08)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <div style={{width:44,height:44,borderRadius:11,background:el.color+"20",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:22}}>{s.sym}</span></div>
          <div>
            <h2 style={{fontFamily:F,fontSize:18,fontWeight:700,margin:0}}>{user.name}</h2>
            <div style={{display:"flex",gap:4,marginTop:3}}><span style={sTag(el.color)}>{s.sym+" "+user.signKey}</span></div>
          </div>
        </div>
        {user.bday&&<div style={{padding:"8px 12px",background:C.gold+"08",borderRadius:8,border:"1px solid "+C.gold+"20",marginBottom:8}}>
          <div style={{fontFamily:F,fontSize:11,fontWeight:700,color:C.gold}}>Your Birthday: {user.bday}</div>
        </div>}
        <div style={sSoft}><div style={sLbl}>Your sign</div><p style={{fontFamily:F,fontSize:13,lineHeight:1.55,margin:0}}>{s.line}</p></div>
      </div>
      <div style={{...sCard,border:"1px solid "+C.gold+"30"}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
          <span>{"\u2728"}</span><span style={{fontFamily:F,fontSize:13,fontWeight:700,color:C.gold}}>AI Horoscope</span>
        </div>
        <button style={{...sBtn,background:C.gold,color:"#000",fontSize:12}} onClick={loadAI} disabled={aiL}>{aiL?"Reading the stars...":"Generate today's reading"}</button>
        {aiH&&<div style={{...sSoft,marginTop:10}}><p style={{fontFamily:F,fontSize:13,lineHeight:1.6,margin:0,whiteSpace:"pre-wrap"}}>{aiH}</p></div>}
      </div>
      <div style={sCard}>
        <div style={sLbl}>Your placements</div>
        {Object.entries(PI).map(([k,p])=>{const pl=user.chart[k];if(!pl)return null;const ps=SIGNS[pl.sign];const pe=EL[ps?.el]||EL.fire;return <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 10px",background:pe.color+"06",borderRadius:8,border:"1px solid "+pe.color+"12",marginBottom:4}}>
          <span style={{fontFamily:F,fontSize:12,color:C.med}}>{p.i+" "+p.n}</span>
          <span style={{fontFamily:F,fontSize:12,fontWeight:700}}>{ps?.sym+" "+pl.sign}</span>
        </div>})}
      </div>
    </div>})()}

    </div>

    {/* AUTH MODAL */}
    {auth&&<div onClick={()=>setAuth(false)} style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.7)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div onClick={e=>e.stopPropagation()} className="fade" style={{...sCard,width:"100%",maxWidth:380,marginBottom:0}}>
        <h3 style={{fontFamily:F,fontSize:17,fontWeight:700,margin:"0 0 3px"}}>Join Birth Chart Path</h3>
        <p style={{fontFamily:F,fontSize:11,color:C.med,margin:"0 0 14px"}}>Get your unique birthday personality + daily readings.</p>
        <input value={aNm} onChange={e=>setANm(e.target.value)} placeholder="First name" style={{...sInp,marginBottom:8}}/>
        <div style={{display:"flex",gap:6,marginBottom:8}}>
          <select value={aMo} onChange={e=>setAMo(e.target.value)} style={sSel}><option value="">Month</option>{MO.map(m=><option key={m}>{m}</option>)}</select>
          <select value={aDy} onChange={e=>setADy(e.target.value)} style={sSel}><option value="">Day</option>{Array.from({length:31},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select>
        </div>
        <select value={aYr} onChange={e=>setAYr(e.target.value)} style={{...sSel,width:"100%",flex:"none",marginBottom:8}}><option value="">Year born</option>{Array.from({length:curYear-1929},(_,i)=>curYear-i).map(y=><option key={y} value={y}>{y}</option>)}</select>
        <div style={{display:"flex",gap:6,marginBottom:8}}>
          <select value={aHr} onChange={e=>setAHr(e.target.value)} style={sSel}><option value="">Hour</option>{Array.from({length:12},(_,i)=><option key={i+1} value={String(i+1)}>{i+1}</option>)}</select>
          <select value={aAp} onChange={e=>setAAp(e.target.value)} style={{...sSel,maxWidth:80}}><option value="AM">AM</option><option value="PM">PM</option></select>
        </div>
        <CityInput inputRef={acity}/>
        <button style={{...sBtn,marginTop:12}} onClick={doAuth}>Get my chart</button>
      </div>
    </div>}
  </div>;
}
