import React, { memo } from 'react';
import Card from './Card';

const Lane = memo(function Lane({ title, cards, onSelectCard, selectedCardId, recentlyAddedCardId }) {
  return (
    <div className="lane">
      <h3>{title}</h3>
      <div className="cards">
        {cards.map(card => (
          <Card
            key={card.id}
            card={card}
            onSelectCard={onSelectCard}
            isSelected={card.id === selectedCardId}
            isHighlighted={card.id === recentlyAddedCardId}
          />
        ))}
      </div>
    </div>
  );
});

export default Lane;
