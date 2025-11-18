import React from 'react';
import HeroSection from '../components/HeroSection';
import FeaturedSection from '../components/FeaturedSection';
import News from './News';
import TrailerSection from './TrailerSections';
// import { useCinema } from '../context/CinemaContext';

const Home = () => {
  // const { selectedCinema } = useCinema();


  return (
    <>
    
      <HeroSection />
      <FeaturedSection />
      <News />
      <TrailerSection />
    </>
  );
};

export default Home;