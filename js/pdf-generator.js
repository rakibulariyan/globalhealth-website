// PDF Generation Function
function generateMemberPDF(memberData) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Set card dimensions (PAN card size: 86x54 mm)
    const cardWidth = 86;
    const cardHeight = 54;
    
    // Add background
    doc.setFillColor(44, 127, 184);
    doc.rect(0, 0, cardWidth, 15, 'F');
    
    // Header
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Global Health Mission', cardWidth/2, 8, { align: 'center' });
    
    // Member photo area
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(240, 240, 240);
    doc.rect(5, 18, 20, 25, 'FD');
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(6);
    doc.text('PHOTO', 15, 30, { align: 'center' });
    
    // Member details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(7);
    
    let yPos = 20;
    doc.text('Name:', 28, yPos); yPos += 4;
    doc.text('Member ID:', 28, yPos); yPos += 4;
    doc.text("Father's Name:", 28, yPos); yPos += 4;
    doc.text('Valid Until:', 28, yPos);
    
    doc.setFont('helvetica', 'normal');
    yPos = 20;
    doc.text(memberData.name, 45, yPos); yPos += 4;
    doc.text(memberData.memberId, 45, yPos); yPos += 4;
    doc.text(memberData.fatherName, 45, yPos); yPos += 4;
    doc.text(memberData.expiryDate.toLocaleDateString(), 45, yPos);
    
    // QR Code area
    doc.setDrawColor(200, 200, 200);
    doc.rect(65, 18, 18, 18, 'S');
    doc.setTextColor(100, 100, 100);
    doc.text('QR CODE', 74, 38, { align: 'center' });
    
    // Footer
    doc.setFontSize(5);
    doc.text('Present this card for 50% discount', cardWidth/2, 48, { align: 'center' });
    
    // Generate filename and save
    const fileName = `GHM_${memberData.memberId}.pdf`;
    doc.save(fileName);
}