export const formatExplanationText = (text: string): string => {
  // Replace newlines with <br> tags
  let formattedText = text.replace(/\n/g, '<br>');
  
  // Basic handling for bullet points (e.g., - item or • item)
  formattedText = formattedText.replace(/\n\s*[-•]\s*(.*?)(?=\n|$)/g, '\n<li>$1</li>');
  
  // If we have list items, wrap them in ul tags
  if (formattedText.includes('<li>')) {
    // Split by double line breaks to handle paragraphs
    const sections = formattedText.split('<br><br>');
    const processedSections = sections.map(section => {
      if (section.includes('<li>')) {
        // This section has list items
        const lines = section.split('<br>');
        let inList = false;
        let result = '';
        
        for (const line of lines) {
          if (line.includes('<li>')) {
            if (!inList) {
              result += '<ul>';
              inList = true;
            }
            result += line;
          } else {
            if (inList) {
              result += '</ul>';
              inList = false;
            }
            if (line.trim()) {
              result += line + '<br>';
            }
          }
        }
        
        if (inList) {
          result += '</ul>';
        }
        
        return result;
      } else {
        return section;
      }
    });
    
    formattedText = processedSections.join('<br><br>');
  }
  
  // Handle bolding (e.g., **text**)
  formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Clean up extra <br> tags
  formattedText = formattedText.replace(/<br><br><br>/g, '<br><br>');
  formattedText = formattedText.replace(/^<br>/, '');
  formattedText = formattedText.replace(/<br>$/, '');
  
  return formattedText;
};