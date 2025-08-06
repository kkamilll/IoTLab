import { Navigate } from 'react-router-dom';

const RootRedirect = () => {
  return <Navigate to="/home" />; // brak replace - zachowuje historię
};

export default RootRedirect;
