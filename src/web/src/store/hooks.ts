import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'; // ^8.0.5
import type { RootState, AppDispatch } from './store';

/**
 * Custom hook that returns a typed dispatch function for the Redux store
 * Use this hook throughout the app instead of plain `useDispatch`
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Custom hook that provides a typed selector function for the Redux store
 * Use this hook throughout the app instead of plain `useSelector`
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;