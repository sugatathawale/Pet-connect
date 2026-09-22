/**
 * Local knowledge base — mirrors backend/ai_assistant/knowledge/content.
 * Used when the Agno API is unreachable so the assistant still answers.
 */

export type KnowledgeDomain = 'greetings' | 'general_faq' | 'dogs' | 'cats';

export interface KnowledgeEntry {
  id: string;
  domain: KnowledgeDomain;
  /** Pipe-separated trigger phrases (lowercased). */
  triggers: string;
  answer: string;
}

export const KNOWLEDGE_ENTRIES: KnowledgeEntry[] = [
  // —— Greetings ——
  {
    id: 'g-hi',
    domain: 'greetings',
    triggers: 'hi|hello|hey|good morning|good afternoon|good evening|namaste|yo',
    answer:
      "Hi! I'm the Pet Connect assistant. I can help with dog and cat breeds, matching nearby pets, breeding availability, listings, and how the app works. What would you like to know?",
  },
  {
    id: 'g-how',
    domain: 'greetings',
    triggers: "how are you|how's it going|how r u",
    answer:
      "Doing great — ready to help you find the right companion for your pet. Ask me about breeds, matching, or anything in Pet Connect!",
  },
  {
    id: 'g-thanks',
    domain: 'greetings',
    triggers: 'thanks|thank you|thx|appreciate it',
    answer:
      "You're welcome! If you have more questions about pets, breeds, or Pet Connect, just ask.",
  },
  {
    id: 'g-bye',
    domain: 'greetings',
    triggers: 'bye|goodbye|see you|talk later',
    answer: 'Bye! Happy matching — come back anytime you need breed tips or help with the app.',
  },
  {
    id: 'g-help',
    domain: 'greetings',
    triggers: 'what can you do|help|how can you help|what do you know',
    answer:
      'I can answer questions about dog and cat breeds, how Pet Connect matching/chats/listings work, breeding availability and privacy, and general in-app FAQs. I stay on-topic for Pet Connect and companion pets.',
  },

  // —— App FAQ ——
  {
    id: 'a-what',
    domain: 'general_faq',
    triggers: 'what is pet connect|what does this app do|tell me about the app|pet connect',
    answer:
      'Pet Connect helps pet owners find compatible companions nearby. Create a profile for your pet, browse pets around you, match on mutual interest, chat once matched, and post pets for adoption or sale.',
  },
  {
    id: 'a-match',
    domain: 'general_faq',
    triggers: 'how does matching work|how do matches work|mutual interest|swipe|discover',
    answer:
      "On Discover, swipe on pets you like. When both owners show interest in each other's pets, you get a match and can chat. Compatibility scores consider breed, age, gender, distance, and health signals.",
  },
  {
    id: 'a-score',
    domain: 'general_faq',
    triggers: 'compatibility score|how is score calculated|what does % mean|compatibility',
    answer:
      'The compatibility score (0–100%) weighs breed similarity, age closeness, complementary gender, distance, and vaccination/health factors. Higher scores mean a stronger nearby match for your pet.',
  },
  {
    id: 'a-add',
    domain: 'general_faq',
    triggers: 'how do i add a pet|create pet profile|register my dog|register my cat|add pet',
    answer:
      "Go to Profile → add a pet. Set species, breed, gender, date of birth, photos, bio, vaccination status, and whether they're open to breeding. Location comes from your device.",
  },
  {
    id: 'a-avail',
    domain: 'general_faq',
    triggers: 'breeding availability|open to breeding|availability window|heat cycle|availability',
    answer:
      'Mark a pet as available for breeding and set a date window. Visibility can be private, matches only, or nearby owners — so reproductive details stay under your control.',
  },
  {
    id: 'a-privacy',
    domain: 'general_faq',
    triggers: 'is my location private|share my address|approximate location|privacy|location',
    answer:
      'Exact addresses are never shown. Distances use your location, and chat location shares are blurred to about a 1 km radius.',
  },
  {
    id: 'a-listings',
    domain: 'general_faq',
    triggers: 'how do listings work|adopt a pet|sell a pet|marketplace|listing|adopt|sell',
    answer:
      'Listings let owners post pets for adoption (no price) or sale (price in rupees). Browse the Listings tab and open a listing for details.',
  },
  {
    id: 'a-chat',
    domain: 'general_faq',
    triggers: 'how does chat work|when can i message|send photos in chat|chat',
    answer:
      'Chat unlocks after a mutual match. You can send text, images, and approximate location. Report or block an owner from the chat menu.',
  },
  {
    id: 'a-notif',
    domain: 'general_faq',
    triggers: 'what notifications|alerts|nearby available|notification',
    answer:
      "You'll get notified about matches, messages, nearby pets that become available, availability reminders, and listing responses.",
  },
  {
    id: 'a-filters',
    domain: 'general_faq',
    triggers: 'how do filters work|filter by breed|distance filter|filter',
    answer:
      'On Nearby, open Filters to limit by distance, species, breed, gender, age range, and "available for breeding only."',
  },
  {
    id: 'a-vax',
    domain: 'general_faq',
    triggers: 'vaccination status|vaccinated|partial|vaccination',
    answer:
      'Vaccination status (vaccinated, partial, or not vaccinated) feeds into the health part of compatibility and helps other owners decide.',
  },
  {
    id: 'a-spay',
    domain: 'general_faq',
    triggers: 'spayed|neutered|can spayed pets breed',
    answer:
      'Pets marked as spayed or neutered are not suitable for breeding. Keep breeding availability off for those pets.',
  },
  {
    id: 'a-support',
    domain: 'general_faq',
    triggers: 'contact support|report a problem|help desk|support',
    answer:
      'Open the menu → Support for account help or reporting misuse. For safety issues in chat, use Report & block.',
  },

  // —— Dogs ——
  {
    id: 'd-lab',
    domain: 'dogs',
    triggers: 'labrador|labrador retriever|lab dog|yellow lab|black lab',
    answer:
      'Labrador Retrievers are friendly, energetic family dogs (25–36 kg) with high exercise needs. Short dense coat; yellow, black, or chocolate. Lifespan ~10–12 years. Often strong matches with other sporting breeds on Pet Connect.',
  },
  {
    id: 'd-golden',
    domain: 'dogs',
    triggers: 'golden retriever|golden|goldie',
    answer:
      'Golden Retrievers are gentle, trainable, and affectionate. Similar size to Labs, love swimming and fetch, need daily exercise and grooming. Watch hips and ears as they age.',
  },
  {
    id: 'd-gsd',
    domain: 'dogs',
    triggers: 'german shepherd|gsd|alsatian',
    answer:
      'German Shepherds are loyal, intelligent, and protective (30–40 kg). High training and exercise needs; heavy shedders. Introduce carefully to other dogs when matching.',
  },
  {
    id: 'd-beagle',
    domain: 'dogs',
    triggers: 'beagle|beagle dog',
    answer:
      'Beagles are curious scent hounds (9–11 kg), pack-oriented and vocal. Need secure fencing and mental stimulation. Generally good with other dogs.',
  },
  {
    id: 'd-pug',
    domain: 'dogs',
    triggers: 'pug|pug dog',
    answer:
      'Pugs are compact companions with flat faces. Low exercise but sensitive to heat and breathing. Great apartment pets — review health notes carefully when matching.',
  },
  {
    id: 'd-indie',
    domain: 'dogs',
    triggers: 'indie dog|indian street dog|pariah|desi dog|indian mongrel',
    answer:
      'Indie (Indian Pariah) dogs are hardy and climate-adapted. Medium size, low grooming, strong immunity when cared for. Common on Pet Connect in Indian cities — temperament varies, so meet after matching.',
  },
  {
    id: 'd-pom',
    domain: 'dogs',
    triggers: 'pomeranian|pom|fluffy small dog',
    answer:
      'Pomeranians are tiny (1.5–3 kg), alert, and fluffy with high grooming needs. Best with careful handling around larger dogs.',
  },
  {
    id: 'd-husky',
    domain: 'dogs',
    triggers: 'husky|siberian husky',
    answer:
      'Huskies need high exercise and cooler climates. Thick double coat, pack-oriented, known escape artists. Not ideal for sedentary homes.',
  },
  {
    id: 'd-bulldog',
    domain: 'dogs',
    triggers: 'bulldog|english bulldog',
    answer:
      'English Bulldogs are calm, heat-sensitive companions with short muzzles. Low stamina; specialised care recommended. Pet Connect connects owners — it is not veterinary advice.',
  },
  {
    id: 'd-rottie',
    domain: 'dogs',
    triggers: 'rottweiler|rottie',
    answer:
      'Rottweilers are powerful guardian dogs needing firm training and socialisation. Best for experienced owners; match with similar-size, well-socialised dogs.',
  },
  {
    id: 'd-shih',
    domain: 'dogs',
    triggers: 'shih tzu|shihtzu',
    answer:
      'Shih Tzus are small companion dogs with long coats needing regular grooming. Affectionate apartment dogs; can be stubborn in training.',
  },
  {
    id: 'd-dach',
    domain: 'dogs',
    triggers: 'dachshund|sausage dog|wiener dog',
    answer:
      'Dachshunds are long-bodied scent hounds. Protect their backs — avoid jumping from heights. Bold personality; handle carefully around larger breeds.',
  },
  {
    id: 'd-boxer',
    domain: 'dogs',
    triggers: 'boxer dog|boxer',
    answer:
      'Boxers are playful, energetic, and loyal. Medium-large with short coats; can be boisterous with smaller dogs — supervise early meetups.',
  },
  {
    id: 'd-cocker',
    domain: 'dogs',
    triggers: 'cocker spaniel|spaniel',
    answer:
      'Cocker Spaniels are affectionate sporting dogs with silky coats needing grooming. Medium size; usually friendly with other dogs when socialised.',
  },
  {
    id: 'd-dobie',
    domain: 'dogs',
    triggers: 'doberman|dobermann',
    answer:
      'Dobermans are athletic and highly trainable. Need experienced handlers and lots of exercise. Structured introductions matter on Pet Connect.',
  },
  {
    id: 'd-size',
    domain: 'dogs',
    triggers: 'small dog breeds|medium dog breeds|large dog breeds|dog sizes',
    answer:
      'Small: Pug, Pomeranian, Shih Tzu, Dachshund. Medium: Beagle, Cocker, Indie. Large: Labrador, Golden, GSD, Husky, Rottweiler, Boxer, Doberman. Size affects safe play when matching.',
  },
  {
    id: 'd-energy',
    domain: 'dogs',
    triggers: 'which dogs need lots of exercise|high energy dogs|lazy dogs|exercise',
    answer:
      'High energy: Husky, GSD, Labrador, Boxer, Doberman. Moderate: Beagle, Indie, Golden, Cocker. Lower: Pug, Bulldog, Shih Tzu, Pomeranian (still need daily walks). Match energy levels for happier pairings.',
  },

  // —— Cats ——
  {
    id: 'c-persian',
    domain: 'cats',
    triggers: 'persian cat|persian|long hair cat',
    answer:
      'Persians are calm, affectionate cats with long coats needing daily grooming. Prefer quiet homes; flat faces may need extra eye care.',
  },
  {
    id: 'c-siamese',
    domain: 'cats',
    triggers: 'siamese|siamese cat',
    answer:
      'Siamese cats are vocal, social, and intelligent with colour-point coats. Need interaction and enrichment; do well with other social cats when introduced carefully.',
  },
  {
    id: 'c-maine',
    domain: 'cats',
    triggers: 'maine coon|maine coon cat|giant cat',
    answer:
      'Maine Coons are large gentle giants with semi-long coats needing brushing. Friendly with families and often other pets.',
  },
  {
    id: 'c-bsh',
    domain: 'cats',
    triggers: 'british shorthair|british short hair|chubby grey cat',
    answer:
      'British Shorthairs are easygoing, sturdy cats with dense coats. Moderate activity — great apartment companions.',
  },
  {
    id: 'c-indie',
    domain: 'cats',
    triggers: 'indie cat|indian cat|desi cat|street cat|mongrel cat',
    answer:
      'Indie (domestic) cats are adaptable and common across India. Varied colours and temperaments; often hardy when vaccinated and well cared for.',
  },
  {
    id: 'c-bengal',
    domain: 'cats',
    triggers: 'bengal cat|bengal',
    answer:
      'Bengals are athletic, high-energy cats with spotted/marbled coats. Need climbing space and play — not ideal for low-stimulation homes.',
  },
  {
    id: 'c-ragdoll',
    domain: 'cats',
    triggers: 'ragdoll|ragdoll cat',
    answer:
      'Ragdolls are large, relaxed, people-oriented cats. Semi-long coat, prefer indoor living and gentle companions.',
  },
  {
    id: 'c-sphynx',
    domain: 'cats',
    triggers: 'sphynx|hairless cat',
    answer:
      'Sphynx cats are hairless and need regular skin care, warmth, and attention. Sensitive to sun and cold.',
  },
  {
    id: 'c-fold',
    domain: 'cats',
    triggers: 'scottish fold|fold ear cat',
    answer:
      'Scottish Folds have folded ears and sweet temperaments. Discuss health openly — cartilage concerns exist in the breed.',
  },
  {
    id: 'c-ash',
    domain: 'cats',
    triggers: 'american shorthair',
    answer:
      'American Shorthairs are sturdy, easygoing cats with low-maintenance coats. Reliable companions for first-time cat owners.',
  },
  {
    id: 'c-multi',
    domain: 'cats',
    triggers: 'can cats live together|introduce two cats|cat matching|multi-cat',
    answer:
      'Slow introductions, separate litter/food/vertical space, and similar energy levels help. Use Pet Connect matches to coordinate careful meetups — do not rush cohabitation.',
  },
  {
    id: 'c-indoor',
    domain: 'cats',
    triggers: 'indoor cat|outdoor cat|keep cat inside',
    answer:
      'Many urban owners keep cats indoors for safety. Enrichment (trees, toys, windows) is essential. Supervise gradual meetups arranged through the app.',
  },
];

export const SCOPE_REFUSAL =
  'I can only help with Pet Connect, companion pets, and dog/cat breed questions. Try asking about matching, listings, availability, or a specific breed.';
