import { useState, useCallback } from 'react';

export function useOptimisticUpdate(asyncFunction) {
  const [value, setValue] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (optimisticValue, onSuccess) => {
    const previousValue = value;

    setValue(optimisticValue);
    setIsLoading(true);
    setError(null);

    try {
      const result = await asyncFunction();
      if (onSuccess) {
        onSuccess(result);
      }
      setValue(optimisticValue);
      return result;
    } catch (err) {
      setError(err);
      setValue(previousValue);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [asyncFunction, value]);

  return { execute, value, isLoading, error };
}
