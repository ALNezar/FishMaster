import './card.scss';

const Card = ({ children, className = '', onClick, style, ...props }) => {
  return (
    <div 
      className={`fish-master-card ${className}`} 
      onClick={onClick}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;