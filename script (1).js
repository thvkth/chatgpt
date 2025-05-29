// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Ensure DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('fileInput');
  const questionInput = document.getElementById('questionInput');
  const submitButton = document.getElementById('submitQuestion');
  const answerOutput = document.getElementById('answerOutput');

  // Check if elements exist
  if (!fileInput || !questionInput || !submitButton || !answerOutput) {
    console.error('One or more DOM elements not found.');
    answerOutput.innerHTML = 'Error: Page elements failed to load.';
    return;
  }

  // Add event listener to the button
  submitButton.addEventListener('click', async () => {
    answerOutput.innerHTML = 'Processing...';

    // Validate inputs
    if (!fileInput.files.length) {
      answerOutput.innerHTML = 'Error: Please upload at least one file.';
      return;
    }

    if (!questionInput.value.trim()) {
      answerOutput.innerHTML = 'Error: Please enter a question.';
      return;
    }

    let fileContent = '';

    // Process all uploaded files
    for (const file of fileInput.files) {
      try {
        if (file.type === 'application/pdf') {
          // Handle .pdf files
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
          let pdfText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            pdfText += textContent.items.map(item => item.str).join(' ') + '\n';
          }
          fileContent += pdfText + '\n';
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          // Handle .docx files
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          fileContent += result.value + '\n';
        } else if (file.type.startsWith('text/') || ['.csv', '.md', '.json'].some(ext => file.name.toLowerCase().endsWith(ext))) {
          // Handle text-based files (.txt, .csv, .md, .json, etc.)
          const text = await file.text();
          fileContent += text + '\n';
        } else {
          // Attempt to read other files as text (fallback)
          try {
            const text = await file.text();
            fileContent += text + '\n';
          } catch {
            console.warn(`Unsupported file type for ${file.name}, skipping.`);
            continue;
          }
        }
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        answerOutput.innerHTML = `Error processing file: ${file.name}`;
        return;
      }
    }

    // Generate answer
    const answer = generateAnswer(fileContent, questionInput.value.trim());
    answerOutput.innerHTML = answer || "ans can't be generated cuz the file doesn't your file(s) provided doesn't contain question-related information.";
  });
});

// Simple keyword-based answer generation
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
