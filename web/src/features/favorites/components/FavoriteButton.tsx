'use client';

import React from 'react';
import { useFavorites } from '../hooks/useFavorites';
import { FavoriteItem } from '../types/favorites';
import { FaHeart } from 'react-icons/fa';

interface FavoriteButtonProps {
  item: FavoriteItem;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({ item }) => {
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const favorite = isFavorite(item.id);

  const handleClick = () => {
    if (favorite) {
      removeFavorite(item.id);
    } else {
      addFavorite(item);
    }
  };

  return (
    <button
      onClick={handleClick}
      aria-label={favorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
      className="p-1 focus:outline-none"
      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
    >
      <FaHeart
        size={22}
        color={favorite ? '#ff9900' : 'transparent'}
        style={{
          fill: favorite ? '#ff9900' : 'none',
          stroke: '#ff9900',
          strokeWidth: favorite ? 2 : 3.5,
          filter: !favorite ? 'drop-shadow(0 0 2px #ff9900)' : undefined,
          transition: 'fill 0.2s, stroke-width 0.2s',
        }}
      />
    </button>
  );
}; 