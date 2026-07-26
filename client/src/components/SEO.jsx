import { useEffect } from "react";

export default function SEO({
  title = "Shyam Bhog | Khatu Shyam Ji Online Arjee, Bhog & Swamani Prasad Booking",
  description = "Khatu Shyam Ji Online Arjee booking, Special Bhog Prasad, Swamani offering & Live Darshan Crowd Status. Dedicated divine service at Shri Khatu Shyam Dham Sikar Rajasthan.",
  keywords = "Khatu Shyam Ji, Shyam Bhog, Khatu Shyam Arjee, Online Arjee Booking, Swamani Prasad, Khatu Shyam Bhog, Khatu Shyam Crowd Status, Darshan Timings",
  canonical = "https://shyambhog.com/",
  ogImage = "https://shyambhog.com/favicon.svg",
  ogType = "website",
  jsonLd = null,
}) {
  useEffect(() => {
    // Update Title
    document.title = title;

    // Helper to update meta tag content
    const updateMetaTag = (selector, attr, attrVal, contentVal) => {
      let element = document.querySelector(`meta[${attr}="${attrVal}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attr, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute("content", contentVal);
    };

    // Update standard meta tags
    updateMetaTag("meta[name='description']", "name", "description", description);
    updateMetaTag("meta[name='keywords']", "name", "keywords", keywords);

    // Update Open Graph tags
    updateMetaTag("meta[property='og:title']", "property", "og:title", title);
    updateMetaTag("meta[property='og:description']", "property", "og:description", description);
    updateMetaTag("meta[property='og:url']", "property", "og:url", canonical);
    updateMetaTag("meta[property='og:image']", "property", "og:image", ogImage);
    updateMetaTag("meta[property='og:type']", "property", "og:type", ogType);

    // Update Twitter Card tags
    updateMetaTag("meta[name='twitter:title']", "name", "twitter:title", title);
    updateMetaTag("meta[name='twitter:description']", "name", "twitter:description", description);
    updateMetaTag("meta[name='twitter:image']", "name", "twitter:image", ogImage);

    // Update Canonical URL link
    let canonicalLink = document.querySelector("link[rel='canonical']");
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", canonical);

    // Dynamic JSON-LD injection
    let scriptTag = document.getElementById("dynamic-seo-jsonld");
    if (jsonLd) {
      if (!scriptTag) {
        scriptTag = document.createElement("script");
        scriptTag.id = "dynamic-seo-jsonld";
        scriptTag.type = "application/ld+json";
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(jsonLd);
    } else if (scriptTag) {
      scriptTag.remove();
    }
  }, [title, description, keywords, canonical, ogImage, ogType, jsonLd]);

  return null;
}
