import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AIChatWidget from '../components/AIChatWidget';

import { useParams } from 'react-router-dom';

const CustomerLayout = ({ children }) => {
  const { restaurantName } = useParams();
  
  // Format the name nicely for the UI (e.g., "bulebet-restaurant" -> "Bulebet Restaurant")
  const formattedName = restaurantName ? restaurantName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'the restaurant';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative' }}>
      <Header />
      <main style={{ flex: 1 }}>
        {children}
      </main>
      <Footer />
      <AIChatWidget role="customer" restaurantName={formattedName} />
    </div>
  );
};

export default CustomerLayout;
