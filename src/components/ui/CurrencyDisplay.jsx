import React from 'react';
import brandingService from '../../services/brandingService';

const CurrencyDisplay = ({ amount, className = '', showCode = true }) => {
  const formatAmount = () => {
    if (typeof amount !== 'number') {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount)) return '$0.00 MXN';
      return brandingService?.formatCurrency(numAmount);
    }
    
    return brandingService?.formatCurrency(amount);
  };

  return (
    <span className={`font-semibold ${className}`}>
      {formatAmount()}
    </span>
  );
};

export default CurrencyDisplay;