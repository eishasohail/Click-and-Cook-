import React, { useEffect, useState } from "react";
import Button from "../components/button/Button";
import "./styles/Hero.css";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const HeroSection = () => {
    const fullText = "Welcome to Click and Cook";
    const [text, setText] = useState("");
    const [cursorVisible, setCursorVisible] = useState(true);

    // ⌨️ Typing effect
    useEffect(() => {
        let i = 0;

        const typing = setInterval(() => {
            setText(fullText.slice(0, i + 1));
            i++;

            if (i === fullText.length) {
                clearInterval(typing);
            }
        }, 90); // typing speed (adjust for faster/slower)

        return () => clearInterval(typing);
    }, []);

    // 🟩 Blinking cursor
    useEffect(() => {
        const blink = setInterval(() => {
            setCursorVisible((v) => !v);
        }, 500);

        return () => clearInterval(blink);
    }, []);

    return (
        <section className="hero-section">

            {/* Left Content */}
            <div className="hero-text">

                {/* 🎬 Typewriter Title */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    aria-label={fullText}
                >
                    {text}
                    <span className="cursor">
                        {cursorVisible ? "|" : " "}
                    </span>
                </motion.h1>

                <p>
                    Your personalized recipe guide to make cooking simple and magical.
                    Bring the whispers of flavor to your kitchen today!
                </p>

                <Link to="/sign-in">
                    <Button variant="primary" size="large">
                        Start Cooking
                    </Button>
                </Link>

            </div>

            {/* Right Card with Favicon */}
            <div className="hero-card">
                <div className="favicon-container">
                    <img src="favicon.svg" alt="Chef's Whispers" />
                </div>
            </div>

        </section>
    );
};

export default HeroSection;