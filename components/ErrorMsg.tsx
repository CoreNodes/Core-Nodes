import { Danger } from "./Icons";

const ErrorMsg: React.FC<{ msg: string }> = (props) => (
  <div className="flex justify-center items-center space-x-2 text-yellow-500 mt-8">
    <Danger />
    <p>{props.msg}</p>
  </div>
);

export default ErrorMsg;
