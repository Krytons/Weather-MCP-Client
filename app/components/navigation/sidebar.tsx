import { useEffect, useState } from "react";
import { useRef } from "react";
import App from '../../root';
import { NavLink } from "@remix-run/react";

import "~/components/navigation/sidebar.css"; 

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);

    const links = [
        {
            path: "/", 
            label: "Home"
        }
    ]

    function toggleSidebar() {
        setIsOpen((prev) => !prev);
    }

    function handleClickOutside(event: MouseEvent | TouchEvent) {
        if (isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
            setIsOpen(false);
        }
    }

    useEffect(() => {
        if(isOpen){
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("touchstart", handleClickOutside);
        }
        else {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        }
    }, [isOpen]);


    return (
        <>
            <button
                className={`hamburger-btn ${isOpen ? "hamburger-btn-hidden" : "hamburger-btn-visible"}`}
                onClick={toggleSidebar}
                aria-label="Toggle menu"
            >
                <div className="hamburger-bar"></div>
                <div className="hamburger-bar"></div>
                <div className="hamburger-bar"></div>
            </button>

            <aside ref={sidebarRef} className={`sidebar-container ${isOpen ? "sidebar-open" : "sidebar-closed"}`}>
                {
                    links.map((link) => (
                        <NavLink 
                            to={link.path}
                            key={link.path}
                            className={({ isActive }) => `sidebar-link ${isActive ? "sidebar-link-active" : ""}`}
                        >
                            {link.label}
                        </NavLink>
                    ))
                }
            </aside>
        </>
    )
}