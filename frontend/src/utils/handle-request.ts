interface ApiResponse {
  error?: string;
  success?: string;
  [key: string]: any;
}

export async function handleRequest(
  url: string,
  method: 'GET' | 'POST' | 'DELETE' | 'PUT' = 'GET',
  setError: (error: string) => void = (_: string) => {},
  useAuthentication: boolean = false,
  body?: {},
  responseType: 'json' | 'response' = 'json'
): Promise<ApiResponse | undefined> {
  try {
    const headers : any = {
      'Content-Type': 'application/json',
    };

    if (useAuthentication) {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      } // else will try to fetch with the refresh token cookie
    }

    const response = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(body),
      credentials: 'include', // Include cookies for refresh token
    });

    if (response.headers.get('x-access-token')) {
      // If the response contains a new access token, update it in localStorage
      const newAccessToken = response.headers.get('x-access-token');
      if (newAccessToken) {
        localStorage.setItem('accessToken', newAccessToken);
      }
    }

    if (!response.ok) {
      // Handle authentication failures
      if (response.status === 401 || response.status === 403) {
        // Clear stored tokens
        localStorage.removeItem('accessToken');
        // Redirect to sign-in page
        window.location.href = '/sign-in';
        return undefined;
      }

      if (response.body) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Request failed with status ' + response.status);
      }
    }

    if (responseType === 'response') {
      return response;
    }

    const data = await response.json();

    if ('success' in data) {
      return data;
    }

    // If neither error nor success, return data as is
    return data;
  } catch (err: any) {
    setError?.(err.message || 'An unexpected error occurred');
    console.error('Request error:', err);
    return undefined;
  }
}