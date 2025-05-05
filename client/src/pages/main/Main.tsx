import type { FC } from 'react';
import Counts from './Counts';
import Hero from './Hero';
import Header from './Header/Header';
import FAQ from './FAQ';
import Contact from './Contact';
import Footer from './Footer';

const extractIframeUrlParam = (): string | null => {
  const { searchParams } = new URL(window.location.href);
  const mapTitle = searchParams.get('maptitle');
  return mapTitle;
};

export const Main: FC = () => {
  const mapTitle = extractIframeUrlParam();
  return (
    <>
      <Header />
      <Hero />

      <main id="main">
        <Counts />
        <FAQ />
        <Contact mapTitle={mapTitle} />
      </main>

      <Footer />

      <a href="/" className="back-to-top">
        <i className="icofont-simple-up" />
      </a>
      <div id="preloader" />
    </>
  );
};

export default Main;
