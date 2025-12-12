import './card.scss';

const Card = ({ children, className = '' }) => {
  return (
    <div className={`fish-master-card ${className}`}>
      {children}
    </div>
  );
};

export default Card;