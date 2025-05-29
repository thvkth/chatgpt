// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

document.getElementById('submitQuestion').addEventListener('click', async () => {
  const fileInput = document.getElementById('fileInput');
  const questionInput = document.getElementById('questionInput').value.trim();
  const answerOutput = document.getElementById('answerOutput');

  // Clear previous output
  answerOutput.innerHTML = 'Processing...';

  if (!fileInput.files.length) {
    answerOutput.innerHTML = 'Error: Please upload at least one file.';
    return;
  }

  if (!questionInput) {
    answerOutput.innerHTML = 'Error: Please enter a question.';
    return;
  }

  let fileContent = '';

  // Process all uploaded files
  for (const file of fileInput.files) {
    try {
      if (file.type === 'text/plain') {
        // Handle .txt files
        const text = await file.text();
        fileContent += text + '\n';
      } else if (file.type === 'application/pdf') {
        // Handle .pdf files
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let pdfText = '';

        // Extract text from each page
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          pdfText += textContent.items.map(item => item.str).join(' ') + '\n';
        }
        fileContent += pdfText + '\n';
      } else {
        answerOutput.innerHTML = `Error: Unsupported file type for ${file.name}.`;
        return;
      }
    } catch (error) {
      console.error('Error processing file:', error);
      answerOutput.innerHTML = `Error processing file: ${file.name}`;
      return;
    }
  }

  // Simple keyword-based answer generation
  const answer = generateAnswer(fileContent, questionInput);
  answerOutput.innerHTML = answer || 'No relevant information found in the uploaded files.';
});

// Basic answer generation function (keyword matching)
function generateAnswer(content, question) {
  const lowerContent = content.toLowerCase();
  const lowerQuestion = question.toLowerCase();
  const sentences = lowerContent.split('\n').filter(s => s.trim());

  // Find sentences containing question keywords
  const keywords = lowerQuestion.split(/\s+/);
  for (const sentence of sentences) {
    if (keywords.some(keyword => sentence.includes(keyword))) {
      return sentence;
    }
  }
  return null;
}
