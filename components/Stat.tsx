const Stat: React.FC = (props) => {
  return <li className="flex lg:grow h-32 justify-center bg-[#282230] flex-col lg:basis-80">{props.children}</li>;
};

export default Stat;
