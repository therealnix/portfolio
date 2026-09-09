import type { ParticleShape } from '../lib/particle-shapes';
// Editable first-person draft. Replace the paragraphs here with the final portfolio copy.
export interface ArticleSection {
    id: string;
    title: string;
    shape: ParticleShape;
    paragraphs: string[];
    href?: string;
    linkLabel?: string;
    tracks?: { id: string; href: string; label: string }[];
}
export const ARTICLE_SECTIONS: ArticleSection[] = [
    {
        id: 'findus', title: 'Starting with an idea', shape: 'findus', href: 'https://go-findus.tech', linkLabel: 'Explore Findus',
        paragraphs: [
            "Findus is what I’m currently working on. It’s a place to bring together the things I enjoy about building software: asking questions, making something tangible, and gradually figuring out what deserves to exist. The interesting part is often the space between the first idea and the version that someone can actually use.",
            "I like working close to that process. A rough interface can make an abstract conversation concrete. A small prototype can reveal more than a long specification. For me, the work is a repeated cycle of building, looking carefully at the result, and making the next version a little clearer.",
        ],
    },
    {
        id: 'jost', title: 'Making a shop worth exploring', shape: 'shop', href: 'https://jost-shop.com', linkLabel: 'Visit Jost-Shop',
        paragraphs: [
            "That curiosity also shows up in Jost-Shop, a custom Shopify storefront I built with a Three.js homepage. A webshop has a very practical job, but I’m interested in how it can have a little personality while still making products easy to discover.",
            "The balance matters to me. Motion should help someone understand where they are, or make an interaction feel satisfying. It should leave enough room for the product itself. This project gave me a chance to connect a more expressive first impression with the familiar structure of an online shop.",
        ],
    },
    {
        id: 'modono', title: 'Building for real businesses', shape: 'modono', href: 'https://mondono.eu', linkLabel: 'Meet Modono',
        paragraphs: [
            "At Modono, I’m the first hired engineer, building webshops for business clients. It’s a different perspective on the same craft: the work needs to fit the people who will maintain the shop as well as the people who will visit it.",
            "I enjoy the mix of careful implementation and practical decisions that comes with that. The goal is to turn a business’s needs into something coherent, useful, and pleasant to work with. It’s also a reminder that a good website is more than its opening screen; the small, ordinary interactions deserve just as much attention.",
        ],
    },
    {
        id: 'music', title: 'A different kind of building', shape: 'music', href: 'https://soundcloud.com/jigglniggl/turntuppp', linkLabel: 'Listen on SoundCloud', tracks: [
            { id: '2292371054', href: 'https://soundcloud.com/jigglniggl/turntuppp', label: 'turntuppp · S0N!K' },
            { id: '2093814105', href: 'https://soundcloud.com/jigglniggl/lamp-rawmix1', label: 'Onedanceee · S0N!K' },
        ],
        paragraphs: [
            "Away from webshops and interfaces, I make music as S0N!K. It gives me another way to experiment: starting with a small idea, trying different combinations, and listening for the moment when the pieces begin to work together. The process feels surprisingly close to making something on the web.",
            "turntuppp is one of the bootlegs on my SoundCloud. I’ve left the player here so you can take a break from reading and hear another side of what I make. There doesn’t need to be a grand explanation behind every project. Sometimes it’s enough to follow an idea because it sounds interesting.",
            "Onedanceee is another piece from that part of my life. Working on music is a useful change of pace: a chance to pay attention to texture, timing, and the feeling of a transition instead of thinking about features and screens.",
            "I like having room for both kinds of work. Sometimes the most useful thing is to step away, listen to something new, and return with a different sense of rhythm. Those small shifts in perspective often find their way into whatever I build next.",
        ],
    },
    {
        id: 'things', title: 'The things in between', shape: 'spark',
        paragraphs: [
            "The mountains in the background belong here too. Time outside, music, and everyday objects that are simply well made are all part of what keeps me curious. I’m interested in the details: how something feels to use, why a particular choice works, and what makes a familiar experience memorable.",
            "This page is a small collection of those interests, rather than a complete inventory. Some become work, some stay experiments, and some are just things I like. If there’s a thread connecting them, it’s the enjoyment of making something and then taking another look.",
        ],
    },
];
