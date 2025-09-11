import { Outlet, useLocation } from "react-router-dom/dist"
import ScrollToTop from "../components/ScrollToTop"
import { Navbar } from "../components/Navbar"
import { Footer } from "../components/Footer"

// Base component that maintains the navbar and footer throughout the page and the scroll to top functionality.
export const Layout = () => {
const location = useLocation();

const sinNavbar= ["/login", "/signup"];

const showNavbar = !sinNavbar.includes(location.pathname);


    return (
        <ScrollToTop>
            {showNavbar && <Navbar />}
                <Outlet />
            <Footer />
        </ScrollToTop>
    )
}