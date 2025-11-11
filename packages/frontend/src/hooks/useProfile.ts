import { useQuery } from '@tanstack/react-query';
import client from '../api/client';

const fetchProfile = async () => {
  const { data } = await client.get('/users/me');
  return data;
};

const useProfile = () => useQuery({ queryKey: ['profile'], queryFn: fetchProfile });

export default useProfile;
