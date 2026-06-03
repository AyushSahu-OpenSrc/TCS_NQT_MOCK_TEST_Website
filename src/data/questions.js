const RESULT_OPTIONS_CACHE = new Map();

export const SECTIONS = [
  { name: 'Numerical Ability', count: 20, normalTimeSec: 25 * 60 },
  { name: 'Verbal Ability', count: 25, normalTimeSec: 25 * 25, perQuestionSec: 25 },
  { name: 'Reasoning Ability', count: 20, normalTimeSec: 25 * 60 },
  { name: 'Advanced Quant', count: 8, normalTimeSec: 15 * 60 },
  { name: 'Advanced Reasoning', count: 8, normalTimeSec: 20 * 60 },
];

export const TOTAL_QUESTIONS = 81;
export const RESULT_DELAY_MS = 10 * 60 * 1000;
export const TEST_DURATION_SEC = SECTIONS.reduce((sum, section) => sum + section.normalTimeSec, 0);

export const TEST_SCHEDULE = [
  { id: 1, at: '2026-06-04T00:30:00+05:30', focus: 'Diagnostic final mock' },
  { id: 2, at: '2026-06-04T20:30:00+05:30', focus: 'Speed + accuracy mock' },
  { id: 3, at: '2026-06-05T00:30:00+05:30', focus: 'Foundation booster mock' },
  { id: 4, at: '2026-06-05T08:30:00+05:30', focus: 'Reasoning heavy mock' },
  { id: 5, at: '2026-06-05T20:30:00+05:30', focus: 'Advanced quant booster' },
  { id: 6, at: '2026-06-06T00:30:00+05:30', focus: 'Mixed final mock' },
  { id: 7, at: '2026-06-06T08:30:00+05:30', focus: 'Weak-section recovery' },
  { id: 8, at: '2026-06-06T20:30:00+05:30', focus: 'Final pressure mock' },
  { id: 9, at: '2026-06-07T00:30:00+05:30', focus: 'Revision mock 1' },
  { id: 10, at: '2026-06-07T20:30:00+05:30', focus: 'Revision mock 2' },
];

function q(section, text, options, answer, explanation, trick = '') {
  return { section, text, options, answer, explanation, trick };
}

function seeded(seed) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function shuffle(items, seedValue) {
  const rand = seeded(seedValue);
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function uniq(arr) {
  return [...new Set(arr.map(String))].slice(0, 4);
}

function numericOptions(answer, step = 1, seed = 1) {
  const key = `${answer}-${step}-${seed}`;
  if (RESULT_OPTIONS_CACHE.has(key)) return RESULT_OPTIONS_CACHE.get(key);
  let base = uniq([answer, Number(answer) + step, Number(answer) - step, Number(answer) + 2 * step, Number(answer) - 2 * step]);
  while (base.length < 4) base.push(String(Number(answer) + (base.length + 2) * step));
  const out = shuffle(base, seed);
  RESULT_OPTIONS_CACHE.set(key, out);
  return out;
}

function gcd(a, b) {
  while (b) [a, b] = [b, a % b];
  return Math.abs(a);
}

function fact(n) {
  let ans = 1;
  for (let i = 2; i <= n; i++) ans *= i;
  return ans;
}

const verbalPool = [
  q('Verbal Ability', 'Choose the synonym of "Abundant".', ['Scarce', 'Plentiful', 'Weak', 'Hidden'], 'Plentiful', 'Abundant means available in large quantity.', 'Synonym questions: replace the word in a sentence and check meaning.'),
  q('Verbal Ability', 'Choose the antonym of "Reluctant".', ['Unwilling', 'Ready', 'Slow', 'Afraid'], 'Ready', 'Reluctant means unwilling; opposite is ready or willing.', 'For antonyms, think of the exact opposite attitude.'),
  q('Verbal Ability', 'Fill in: He is good ___ mathematics.', ['in', 'at', 'on', 'for'], 'at', 'The correct phrase is "good at".', 'Fixed preposition: good at, interested in, senior to.'),
  q('Verbal Ability', 'Identify the error: She do not like tea.', ['She', 'do not', 'like', 'tea'], 'do not', 'With "she", use "does not".', 'Singular subject: does; plural subject: do.'),
  q('Verbal Ability', 'Choose the correctly spelled word.', ['Accomodate', 'Acommodate', 'Accommodate', 'Acomodate'], 'Accommodate', 'Correct spelling has double c and double m.', 'Memory: accommodate has room for two c and two m.'),
  q('Verbal Ability', 'One-word substitute: A person who speaks many languages.', ['Monarch', 'Polyglot', 'Patriot', 'Nomad'], 'Polyglot', 'A polyglot knows or speaks many languages.', 'Poly means many.'),
  q('Verbal Ability', 'Fill in: Neither Riya nor her friends ___ coming.', ['is', 'are', 'was', 'be'], 'are', 'Verb agrees with the nearer subject: friends are.', 'Neither/nor: verb follows the nearer subject.'),
  q('Verbal Ability', 'Choose the synonym of "Brief".', ['Short', 'Large', 'Late', 'Clear'], 'Short', 'Brief means short in duration or length.', 'Brief = short.'),
  q('Verbal Ability', 'Choose the antonym of "Transparent".', ['Clear', 'Opaque', 'Bright', 'Visible'], 'Opaque', 'Opaque means not transparent.', 'Opaque blocks light.'),
  q('Verbal Ability', 'Select the correct sentence.', ['He don’t know.', 'He doesn’t knows.', 'He doesn’t know.', 'He not know.'], 'He doesn’t know.', 'After does/does not, use the base verb "know".', 'Does already carries tense; main verb stays base.'),
  q('Verbal Ability', 'Fill in: I have been waiting ___ two hours.', ['since', 'for', 'from', 'during'], 'for', 'Use "for" with duration.', 'For duration, since starting point.'),
  q('Verbal Ability', 'Meaning of idiom: "Break the ice".', ['Start a conversation', 'End a fight', 'Create a problem', 'Take rest'], 'Start a conversation', 'It means to initiate conversation and reduce awkwardness.', 'Ice = silence; break it = start talking.'),
  q('Verbal Ability', 'Passive voice: They completed the work.', ['The work completed them.', 'The work was completed by them.', 'The work is completing.', 'They were completed by work.'], 'The work was completed by them.', 'Past simple passive: was/were + V3.', 'Object becomes subject in passive voice.'),
  q('Verbal Ability', 'Choose the synonym of "Rapid".', ['Fast', 'Calm', 'Weak', 'Tiny'], 'Fast', 'Rapid means fast.', 'Rapid = fast speed.'),
  q('Verbal Ability', 'Choose the antonym of "Expand".', ['Increase', 'Stretch', 'Reduce', 'Include'], 'Reduce', 'Expand means increase; the opposite is reduce or contract.', 'Expand grows; reduce shrinks.'),
  q('Verbal Ability', 'Fill in: She is senior ___ me.', ['than', 'to', 'from', 'over'], 'to', 'Correct phrase: senior to.', 'Senior/junior/superior/inferior take "to".'),
  q('Verbal Ability', 'Choose the correct article: He is ___ honest man.', ['a', 'an', 'the', 'no article'], 'an', 'Honest begins with a vowel sound because h is silent.', 'Article depends on sound, not spelling.'),
  q('Verbal Ability', 'Choose the correct word: The principal gave good ___.', ['advise', 'advice', 'advices', 'advising'], 'advice', 'Advice is the noun; advise is the verb.', 'Advice noun, advise verb.'),
  q('Verbal Ability', 'Find the error: Each of the boys have a pen.', ['Each', 'of the boys', 'have', 'a pen'], 'have', 'Each is singular, so use "has".', 'Each/every takes singular verb.'),
  q('Verbal Ability', 'Choose the synonym of "Diligent".', ['Lazy', 'Hardworking', 'Careless', 'Noisy'], 'Hardworking', 'Diligent means hardworking and careful.', 'Diligent student works daily.'),
  q('Verbal Ability', 'Fill in: The train arrived ___ time.', ['on', 'in', 'at', 'over'], 'on', 'On time means punctual.', 'On time = punctual; in time = before too late.'),
  q('Verbal Ability', 'Choose the antonym of "Victory".', ['Win', 'Defeat', 'Success', 'Triumph'], 'Defeat', 'Defeat is the opposite of victory.', 'Victory vs defeat.'),
  q('Verbal Ability', 'Correct sentence.', ['I prefer tea than coffee.', 'I prefer tea to coffee.', 'I prefer tea over than coffee.', 'I prefer tea from coffee.'], 'I prefer tea to coffee.', 'Prefer takes "to", not than.', 'Prefer X to Y.'),
  q('Verbal Ability', 'Meaning of idiom: "Hit the nail on the head".', ['Say exactly right', 'Work hard', 'Miss a chance', 'Argue loudly'], 'Say exactly right', 'It means to say exactly the right thing.', 'Nail-head means exact point.'),
  q('Verbal Ability', 'Choose synonym of "Obsolete".', ['Modern', 'Outdated', 'Useful', 'Sharp'], 'Outdated', 'Obsolete means no longer used.', 'Obsolete = old/outdated technology.'),
  q('Verbal Ability', 'Fill in: He has lived here ___ 2020.', ['for', 'since', 'from', 'by'], 'since', 'Use since with a starting point.', 'Since + starting point.'),
  q('Verbal Ability', 'Choose antonym of "Artificial".', ['Fake', 'Natural', 'Created', 'Synthetic'], 'Natural', 'Artificial means man-made; the opposite is natural.', 'Artificial vs natural.'),
  q('Verbal Ability', 'If I ___ rich, I would help others.', ['am', 'was', 'were', 'be'], 'were', 'Hypothetical condition uses "were".', 'Imaginary condition: If I were.'),
  q('Verbal Ability', 'Choose synonym of "Accurate".', ['Wrong', 'Exact', 'Loose', 'Late'], 'Exact', 'Accurate means exact or correct.', 'Accurate = exact.'),
  q('Verbal Ability', 'Fill in: The committee ___ divided in opinion.', ['are', 'is', 'were', 'be'], 'is', 'Committee as one body takes a singular verb.', 'Collective noun as one unit = singular.'),
  q('Verbal Ability', 'Choose antonym of "Generous".', ['Kind', 'Selfish', 'Helpful', 'Brave'], 'Selfish', 'Selfish is opposite of generous.', 'Generous gives; selfish keeps.'),
  q('Verbal Ability', 'Choose correct sentence.', ['She is more smarter.', 'She is smarter.', 'She is most smarter.', 'She smarter is.'], 'She is smarter.', 'Do not use more with an -er comparative.', 'Never double comparative: more + smarter is wrong.'),
  q('Verbal Ability', 'One-word substitute: Study of birds.', ['Ornithology', 'Botany', 'Zoology', 'Geology'], 'Ornithology', 'Ornithology is the study of birds.', 'Orni relates to birds.'),
  q('Verbal Ability', 'Fill in: He congratulated me ___ my success.', ['for', 'on', 'at', 'by'], 'on', 'Correct phrase: congratulate on.', 'Congratulate someone on something.'),
  q('Verbal Ability', 'Choose synonym of "Fragile".', ['Strong', 'Delicate', 'Heavy', 'Common'], 'Delicate', 'Fragile means easily broken or delicate.', 'Fragile glass = delicate.'),
  q('Verbal Ability', 'Antonym of "Ancient".', ['Old', 'Modern', 'Historic', 'Past'], 'Modern', 'Modern is opposite of ancient.', 'Ancient past, modern present.'),
  q('Verbal Ability', 'Correct word: The news ___ shocking.', ['are', 'were', 'is', 'be'], 'is', 'News is singular uncountable.', 'News looks plural but is singular.'),
  q('Verbal Ability', 'Meaning of "once in a blue moon".', ['Very rarely', 'Every day', 'Very soon', 'Never'], 'Very rarely', 'The idiom means very rarely.', 'Blue moon is rare.'),
  q('Verbal Ability', 'Choose synonym of "Essential".', ['Necessary', 'Optional', 'Tiny', 'Hidden'], 'Necessary', 'Essential means necessary.', 'Essential = must-have.'),
  q('Verbal Ability', 'Fill in: I am looking forward ___ meeting you.', ['to', 'for', 'at', 'on'], 'to', 'Look forward to + gerund.', 'Look forward to meeting, not meet.'),
  q('Verbal Ability', 'Choose antonym of "Permanent".', ['Stable', 'Temporary', 'Fixed', 'Lasting'], 'Temporary', 'Temporary is opposite of permanent.', 'Permanent stays; temporary goes.'),
  q('Verbal Ability', 'Find error: The sceneries here are beautiful.', ['The', 'sceneries', 'here', 'are beautiful'], 'sceneries', 'Scenery is usually uncountable; use "scenery".', 'Scenery has no regular plural in this usage.'),
  q('Verbal Ability', 'Choose synonym of "Confident".', ['Sure', 'Afraid', 'Weak', 'Silent'], 'Sure', 'Confident means sure or self-assured.', 'Confident = sure.'),
  q('Verbal Ability', 'Fill in: Please comply ___ the rules.', ['to', 'with', 'for', 'on'], 'with', 'Correct phrase: comply with.', 'Comply with rules.'),
  q('Verbal Ability', 'Antonym of "Accept".', ['Receive', 'Reject', 'Take', 'Agree'], 'Reject', 'Reject is opposite of accept.', 'Accept vs reject.'),
  q('Verbal Ability', 'Correct sentence.', ['He is suffering from fever.', 'He is suffering with fever.', 'He suffers by fever.', 'He suffering fever.'], 'He is suffering from fever.', 'Suffer from is the standard phrase.', 'Suffer from disease/problem.'),
  q('Verbal Ability', 'Synonym of "Hostile".', ['Friendly', 'Unfriendly', 'Calm', 'Helpful'], 'Unfriendly', 'Hostile means unfriendly or aggressive.', 'Hostile enemy = unfriendly.'),
  q('Verbal Ability', 'Fill in: The manager insisted ___ punctuality.', ['on', 'for', 'at', 'to'], 'on', 'Insist on is correct.', 'Insist on something.'),
  q('Verbal Ability', 'Antonym of "Include".', ['Contain', 'Exclude', 'Add', 'Hold'], 'Exclude', 'Exclude is opposite of include.', 'Include in, exclude out.'),
  q('Verbal Ability', 'Choose correct article: ___ Ganga is a holy river.', ['A', 'An', 'The', 'No article'], 'The', 'Use the before river names.', 'The + river name.'),
  q('Verbal Ability', 'Synonym of "Cautious".', ['Careful', 'Careless', 'Fast', 'Brave'], 'Careful', 'Cautious means careful.', 'Caution = care.'),
  q('Verbal Ability', 'Fill in: He is junior ___ me.', ['than', 'to', 'from', 'over'], 'to', 'Junior to is correct.', 'Junior/senior take to.'),
  q('Verbal Ability', 'Antonym of "Minimum".', ['Least', 'Maximum', 'Small', 'Lower'], 'Maximum', 'Maximum is opposite of minimum.', 'Min vs max.'),
  q('Verbal Ability', 'The police ___ investigating.', ['is', 'are', 'was', 'be'], 'are', 'Police is usually treated as plural.', 'Police are, news is.'),
  q('Verbal Ability', 'Meaning of "spill the beans".', ['Reveal a secret', 'Cook food', 'Waste time', 'Run away'], 'Reveal a secret', 'The idiom means reveal secret information.', 'Beans out = secret out.'),
];

function makeNumerical(testId) {
  const arr = [];
  for (let i = 0; i < 20; i++) {
    const type = i % 10;
    const base = 45 + testId * 4 + i * 6;
    if (type === 0) {
      const p = 10 + ((testId + i) % 20);
      const answer = base + (base * p) / 100;
      arr.push(q('Numerical Ability', `What is ${p}% increase of ${base}?`, numericOptions(answer, 5, testId + i), String(answer), `Increase = original + ${p}% of original = ${base} + ${(base * p) / 100} = ${answer}.`, 'Percentage increase: New value = old value × (100 + rate)/100.'));
    }
    if (type === 1) {
      const cp = 100 + (testId + i) * 8;
      const pr = 10 + ((i + testId) % 15);
      const answer = Math.round((cp * (100 + pr)) / 100);
      arr.push(q('Numerical Ability', `A product costs ₹${cp}. It is sold at ${pr}% profit. Find the selling price.`, numericOptions(answer, 6, testId * 2 + i), String(answer), `SP = CP × (100 + profit%)/100 = ${cp} × ${100 + pr}/100 = ${answer}.`, 'Profit: SP is greater than CP.'));
    }
    if (type === 2) {
      const p = 800 + 50 * i + 20 * testId;
      const r = 5 + (i % 5);
      const t = 2 + (testId % 3);
      const answer = (p * r * t) / 100;
      arr.push(q('Numerical Ability', `Find simple interest on ₹${p} at ${r}% for ${t} years.`, numericOptions(answer, 20, testId * 3 + i), String(answer), `SI = PRT/100 = ${p} × ${r} × ${t}/100 = ${answer}.`, 'Simple interest = PRT/100.'));
    }
    if (type === 3) {
      const a = 20 + i + testId, b = 30 + i * 2, c = 40 + testId * 2;
      const answer = Math.round((a + b + c) / 3);
      arr.push(q('Numerical Ability', `Average of ${a}, ${b}, ${c} is closest to?`, numericOptions(answer, 2, testId * 4 + i), String(answer), `Average = (${a}+${b}+${c})/3 = ${(a + b + c) / 3}. Closest integer is ${answer}.`, 'Average = total / number of terms.'));
    }
    if (type === 4) {
      const a = 6 + (i % 5), b = 8 + (testId % 5);
      const answer = Math.round((a * b) / (a + b));
      arr.push(q('Numerical Ability', `A can finish work in ${a} days and B in ${b} days. Together they finish in approx?`, numericOptions(answer, 1, testId * 5 + i), String(answer), `Together time = AB/(A+B) = ${(a * b) / (a + b)} days. Closest option is ${answer}.`, 'Work together: time = product/sum when one job is involved.'));
    }
    if (type === 5) {
      const speed = 40 + i + testId, time = 2 + (i % 4);
      const answer = speed * time;
      arr.push(q('Numerical Ability', `A vehicle travels at ${speed} km/h for ${time} hours. Distance?`, numericOptions(answer, 10, testId * 6 + i), String(answer), `Distance = speed × time = ${speed} × ${time} = ${answer} km.`, 'Distance = speed × time.'));
    }
    if (type === 6) {
      const x = 3 + (i % 4), y = 5 + (testId % 4), total = (x + y) * (10 + i);
      const answer = (total * x) / (x + y);
      arr.push(q('Numerical Ability', `₹${total} is divided in ratio ${x}:${y}. Find first share.`, numericOptions(answer, 10, testId * 7 + i), String(answer), `First share = total × ${x}/(${x}+${y}) = ${answer}.`, 'Ratio share = total × required part / sum of parts.'));
    }
    if (type === 7) {
      const age = 18 + i + testId, after = 5;
      const answer = age + after;
      arr.push(q('Numerical Ability', `A person's age is ${age}. What will be the age after ${after} years?`, numericOptions(answer, 1, testId * 8 + i), String(answer), `Future age = current age + years = ${age}+${after} = ${answer}.`, 'Age after n years: add n.'));
    }
    if (type === 8) {
      arr.push(q('Numerical Ability', 'What is the probability of getting an even number on a fair die?', ['1/2', '1/3', '2/3', '1/6'], '1/2', 'Even outcomes are 2, 4, 6 = 3 outcomes out of 6. Probability = 3/6 = 1/2.', 'Probability = favourable / total.'));
    }
    if (type === 9) {
      const a = 12 + i, b = 18 + testId;
      const answer = gcd(a, b);
      arr.push(q('Numerical Ability', `Find HCF of ${a} and ${b}.`, numericOptions(answer, 1, testId * 9 + i), String(answer), `HCF is the greatest common divisor of ${a} and ${b}, which is ${answer}.`, 'HCF: largest number that divides both.'));
    }
  }
  return arr;
}

function makeReasoning(testId) {
  const arr = [];
  for (let i = 0; i < 20; i++) {
    const type = i % 8;
    if (type === 0) {
      const a = 2 + testId + i, d = 3 + (i % 5), answer = a + 4 * d;
      arr.push(q('Reasoning Ability', `Find next number: ${a}, ${a + d}, ${a + 2 * d}, ${a + 3 * d}, ?`, numericOptions(answer, 2, testId * 10 + i), String(answer), `The series increases by ${d}. Next term = ${a + 3 * d} + ${d} = ${answer}.`, 'Series: first check constant difference.'));
    }
    if (type === 1) {
      const a = 1 + ((testId + i) % 10), answer = a + 8;
      arr.push(q('Reasoning Ability', `Complete series: ${a}, ${a + 2}, ${a + 4}, ${a + 6}, ?`, numericOptions(answer, 1, testId * 11 + i), String(answer), 'Difference is +2 each time.', 'Series: write the differences above the numbers.'));
    }
    if (type === 2) {
      const shift = ((testId + i) % 4) + 1;
      const coded = [...'CAT'].map(ch => String.fromCharCode(ch.charCodeAt(0) + shift)).join('');
      const answer = [...'DOG'].map(ch => String.fromCharCode(ch.charCodeAt(0) + shift)).join('');
      arr.push(q('Reasoning Ability', `If CAT is coded as ${coded}, using same shift DOG is coded as?`, shuffle([answer, 'EPH', 'FQI', 'HSL'], testId + i), answer, `Each letter shifts by +${shift}. Therefore DOG becomes ${answer}.`, 'Coding: compare first word letters to get shift.'));
    }
    if (type === 3) {
      arr.push(q('Reasoning Ability', 'Odd one out: Apple, Mango, Potato, Banana', ['Apple', 'Mango', 'Potato', 'Banana'], 'Potato', 'Potato is a vegetable; others are fruits.', 'Odd one out: identify category first.'));
    }
    if (type === 4) {
      arr.push(q('Reasoning Ability', 'A is brother of B. B is sister of C. How is A related to C?', ['Brother', 'Sister', 'Father', 'Cannot be determined'], 'Brother', 'A is male sibling. Since B and C are siblings, A is also a brother of C.', 'Family tree: mark gender first.'));
    }
    if (type === 5) {
      arr.push(q('Reasoning Ability', 'If all pens are books and all books are papers, then all pens are?', ['Papers', 'Only books', 'Pencils', 'None'], 'Papers', 'Pens are inside books and books are inside papers. Therefore all pens are papers.', 'Syllogism: draw circles.'));
    }
    if (type === 6) {
      arr.push(q('Reasoning Ability', 'A man walks 5 km north, then 5 km east. In which direction is he from start?', ['North-East', 'South-East', 'North-West', 'East'], 'North-East', 'He moved both north and east from starting point.', 'Direction: draw arrows immediately.'));
    }
    if (type === 7) {
      arr.push(q('Reasoning Ability', 'Arrange in meaningful order: 1. Interview 2. Application 3. Selection 4. Joining', ['2-1-3-4', '1-2-3-4', '2-3-1-4', '4-3-2-1'], '2-1-3-4', 'First application, then interview, selection and joining.', 'Process order: think real-life sequence.'));
    }
  }
  return arr;
}

function makeAdvancedQuant(testId) {
  const arr = [];
  for (let i = 0; i < 8; i++) {
    if (i % 4 === 0) {
      const n = 5 + ((testId + i) % 3);
      const answer = fact(n);
      arr.push(q('Advanced Quant', `In how many ways can ${n} different books be arranged on a shelf?`, numericOptions(answer, 20, testId * 20 + i), String(answer), `Number of arrangements of ${n} distinct items = ${n}! = ${answer}.`, 'Arrangement of all distinct items = factorial.'));
    }
    if (i % 4 === 1) {
      arr.push(q('Advanced Quant', 'A bag has 3 red and 2 blue balls. Probability of drawing a red ball?', ['3/5', '2/5', '1/5', '3/2'], '3/5', 'Total balls = 5 and red balls = 3. Probability = 3/5.', 'Probability = favourable / total.'));
    }
    if (i % 4 === 2) {
      const x = 2 + testId + i;
      const answer = x * x + 2 * x + 1;
      arr.push(q('Advanced Quant', `If x=${x}, find x² + 2x + 1.`, numericOptions(answer, 5, testId * 21 + i), String(answer), `x² + 2x + 1 = (x+1)² = ${x + 1}² = ${answer}.`, 'Recognize identities to save time.'));
    }
    if (i % 4 === 3) {
      const a = 8 + i + testId, b = 4 + (i % 3);
      const answer = a * b;
      arr.push(q('Advanced Quant', `A rectangle has length ${a} and breadth ${b}. Find area.`, numericOptions(answer, 4, testId * 22 + i), String(answer), `Area = length × breadth = ${a} × ${b} = ${answer}.`, 'Area rectangle = L × B.'));
    }
  }
  return arr;
}

function makeAdvancedReasoning() {
  return [
    q('Advanced Reasoning', 'Five friends sit in a row. If order is A-B-C-D-E, who is in the middle?', ['A', 'B', 'C', 'D'], 'C', 'In A-B-C-D-E, C is in the third/middle position.', 'Seating: write positions 1 to 5.'),
    q('Advanced Reasoning', 'Statement: All engineers are graduates. Some graduates are managers. Conclusion: Some engineers are managers.', ['Definitely true', 'Definitely false', 'Cannot be determined', 'None'], 'Cannot be determined', 'The overlap between engineers and managers is not guaranteed.', 'Syllogism: do not assume extra overlap.'),
    q('Advanced Reasoning', 'Find missing term: AZ, BY, CX, DW, ?', ['EV', 'FU', 'EW', 'DV'], 'EV', 'First letters increase A,B,C,D,E and second letters decrease Z,Y,X,W,V.', 'Pair series often has two simultaneous patterns.'),
    q('Advanced Reasoning', 'If 1=3, 2=6, 3=9, then 7=?', ['18', '21', '24', '27'], '21', 'Pattern is ×3. Therefore 7 × 3 = 21.', 'In coded equations, check multiplication first.'),
    q('Advanced Reasoning', 'Which relation is correct: Car, Vehicle, Tyre?', ['Car subset Vehicle; Tyre is part', 'Vehicle subset Car', 'Tyre subset Car', 'All same'], 'Car subset Vehicle; Tyre is part', 'Car is a type of vehicle; tyre is a part, not a type of car.', 'Venn questions: type-of and part-of are different.'),
    q('Advanced Reasoning', 'A clock shows 3:15. Approx angle between hands?', ['0°', '7.5°', '30°', '45°'], '7.5°', 'At 3:15, minute hand is at 90° and hour hand is at 97.5°. Difference = 7.5°.', 'Clock: hour hand moves 0.5° per minute.'),
    q('Advanced Reasoning', 'If today is Wednesday, what day after 17 days?', ['Friday', 'Saturday', 'Sunday', 'Monday'], 'Saturday', '17 mod 7 = 3. Wednesday + 3 days = Saturday.', 'Day questions: divide by 7 and use remainder.'),
    q('Advanced Reasoning', 'In a queue, Raj is 12th from front and 18th from back. Total people?', ['29', '30', '31', '28'], '29', 'Total = front position + back position - 1 = 12 + 18 - 1 = 29.', 'Queue total = left + right - 1.'),
  ];
}

export function buildTest(testId) {
  const questions = [
    ...makeNumerical(testId),
    ...shuffle(verbalPool, testId * 17).slice(0, 25),
    ...makeReasoning(testId),
    ...makeAdvancedQuant(testId),
    ...makeAdvancedReasoning(),
  ];

  return questions.slice(0, TOTAL_QUESTIONS).map((item, index) => ({
    id: `${testId}-${index + 1}`,
    number: index + 1,
    ...item,
  }));
}
