import React from 'react';
import HeroSection from '../components/HeroSection';
import FeaturedSection from '../components/FeaturedSection';
import { useCinema } from '../context/CinemaContext';

const Home = () => {
  const { selectedCinema } = useCinema();


  return (
    <>
      <HeroSection />
      <FeaturedSection />
    </>
  );
};

export default Home;