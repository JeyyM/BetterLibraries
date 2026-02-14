// Miro Integration Service
// Handles Miro board creation, embedding, and management via Miro REST API

interface MiroBoard {
  id: string;
  embedUrl: string;
  viewUrl: string;
  name?: string;
}

interface MiroAPIResponse {
  id: string;
  name: string;
  viewLink: string;
  // ... other Miro API fields
}

/**
 * Create a new Miro board using the Miro REST API
 * This automatically creates a unique board for each student+book combination
 */
export const createReadingBoard = async (
  bookId: string,
  bookTitle: string,
  userEmail: string,
  customName?: string // Optional custom name for the board
): Promise<MiroBoard> => {
  const accessToken = import.meta.env.VITE_MIRO_ACCESS_TOKEN;
  
  // Hardcode email for demo purposes (hackathon)
  const demoEmail = 'jeymson8000@gmail.com';
  
  if (!accessToken) {
    console.error('❌ No Miro access token found. Cannot create boards without token.');
    throw new Error('Miro access token not configured');
  }

  try {
    console.log('🎨 Creating new Miro board via API...');
    console.log('📚 Book:', bookTitle);
    console.log('👤 Demo Email:', demoEmail);
    console.log('🔧 (Actual user email:', userEmail, '- hardcoded for demo)');
    console.log('🔑 Token (first 20 chars):', accessToken.substring(0, 20) + '...');

    // Use custom name if provided, otherwise use default format
    const boardName = customName || `${bookTitle} - Reading Notes`;
    
    const requestBody = {
      name: boardName,
      description: customName ? `Assignment task for ${bookTitle}` : `Reading notes for ${bookTitle}`,
    };
    
    console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));

    // Create board via Miro REST API
    const response = await fetch('https://api.miro.com/v2/boards', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Miro API Error:', errorText);
      throw new Error(`Failed to create Miro board: ${response.status} - ${errorText}`);
    }

    const data: MiroAPIResponse = await response.json();
    
    console.log('✅ Board created successfully!');
    console.log('🔗 Board ID:', data.id);
    console.log('🌐 View Link:', data.viewLink);
    console.log('📺 Embed URL will be:', `https://miro.com/app/live-embed/${data.id}/?moveToWidget=auto`);

    // Generate embed URL
    const embedUrl = `https://miro.com/app/live-embed/${data.id}/?moveToWidget=auto`;
    
    return {
      id: data.id,
      embedUrl,
      viewUrl: data.viewLink,
      name: data.name
    };
  } catch (error) {
    console.error('❌ Error creating Miro board:', error);
    throw error; // Re-throw so calling code can handle it
  }
};

/**
 * Get or create a Miro board for a specific book and user
 */
export const getOrCreateReadingBoard = async (
  bookId: string,
  bookTitle: string,
  userEmail: string,
  existingBoardId?: string | null
): Promise<MiroBoard> => {
  // If board already exists, return it
  if (existingBoardId) {
    const embedUrl = `https://miro.com/app/live-embed/${existingBoardId}/?moveToWidget=auto`;
    const viewUrl = `https://miro.com/app/board/${existingBoardId}/`;
    
    console.log('📋 Using existing Miro board:', existingBoardId);
    
    return {
      id: existingBoardId,
      embedUrl,
      viewUrl
    };
  }

  // Otherwise create new board via API
  console.log('🆕 No existing board found, creating new one...');
  return createReadingBoard(bookId, bookTitle, userEmail);
};

/**
 * Generate Miro embed URL with custom settings
 */
export const generateEmbedUrl = (
  boardId: string,
  options: {
    editable?: boolean;
    showUI?: boolean;
    autoZoom?: boolean;
  } = {}
): string => {
  const {
    editable = true,
    showUI = false,
    autoZoom = true
  } = options;

  let url = `https://miro.com/app/live-embed/${boardId}/?`;
  
  if (autoZoom) {
    url += 'moveToWidget=auto&';
  }
  
  if (!editable) {
    url += 'embedMode=view_only&';
  } else if (!showUI) {
    url += 'embedMode=view_only_without_ui&';
  }

  return url;
};

/**
 * Open Miro board in new tab
 */
export const openBoardInNewTab = (boardId: string) => {
  const url = `https://miro.com/app/board/${boardId}/`;
  window.open(url, '_blank', 'noopener,noreferrer');
};
