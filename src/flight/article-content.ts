import type { ParticleShape } from '../lib/particle-shapes';

export interface ArticleSection {
    id: string;
    title: string;
    shape: ParticleShape;
    paragraphs: string[];
    href?: string;
    tracks?: { id: string; href: string; label: string }[];
}
export const ARTICLE_SECTIONS: ArticleSection[] = [
    {
        id: 'findus', title: 'Go-findus', shape: 'findus', href: 'https://go-findus.tech',
        paragraphs: [
            "That’s what I dedicate most of my time to right now. With findus I want to collect aggregate and make valuable customer data attainable to business that don't have the time and money to care about those things. My goal is to lower the barrier of technical knowledge one hast to have to an absolute minimum by analyzing and processing data to a point where users get direct feedback and recommendations via WhatsApp messages sent by the findus agent. Also the platform fully integrates into your google business eco system enabling findus to make posts, update your profile and offerings and answer to comments fully autonomously with the goal of boosting your seo and geo performance to an absolute maximum. Stay tuned on that one because there definitely is more to come 🕺",
        ],
    },
    {
        id: 'mondono', title: 'Mondono', shape: 'modono', href: 'https://mondono.eu',
        paragraphs: [
            "Founded by a friend of mine, mondono is my current side hustle. Here I support as a full stack dev building a custom webshop ecosystem in cooperation with TLN as a supplier. That one is especially interesting as they already pull some big clients. Stoked on what's about to come in that domain.",
        ],
    },
    {
        id: 'bmw', title: 'BMW', shape: 'car',
        paragraphs: [
            "That’s the company I study dually at. Currently in third semester, I have already spent a total of more than 2 years there. In that time I've been through some different departments, mainly focusing on the Autonomous driving sector. My tasks here have ranged from building tools around car signal and camera data that support with development to my current work with vision transformers trying to achieve camera calibration while standing.",
        ],
    },
    {
        id: 'music', title: 'Music', shape: 'music', tracks: [
            { id: '2292371054', href: 'https://soundcloud.com/jigglniggl/turntuppp', label: 'turntuppp · S0N!K' },
            { id: '2093814105', href: 'https://soundcloud.com/jigglniggl/lamp-rawmix1', label: 'Onedanceee · S0N!K' },
        ],
        paragraphs: [
            "Music has been a part of my life since I can think. The amount of different emotion that can be carried by Soundwaves is really crazy in my opinion. Because of that I startet picking up music production as a hobby in my teens and it's been bringing me a lot of joy since then. Fell free to check it out on SoundCloud :).",
        ],
    },
    {
        id: 'things', title: 'What else i find cool', shape: 'spark',
        paragraphs: [
            "Beluga lentils, Adam Audio T7V, Traktor Controll MX-2, Hyperlite Pleasure, Lowa Cadin II, Arizona Iced Tea, Paracord, Luma, Niagara Launcher, Volleyball, BMW f87, ScreenZen, The Sickos, Billabong Boardshorts, Ikea, Rossignol Ski Boots, Nosebutter 360s, Sendlinger Spezialkebab, Victorinox, U3 Universität, FL Studio updates, myradl",
        ],
    },
];
