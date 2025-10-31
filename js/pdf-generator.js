// ==========================
//  GLOBAL HEALTH MISSION
//  PDF Generator (Card + Invoice)
// ==========================
async function generateMemberPDF(member) {
  // ensure jsPDF is available
  const { jsPDF } = window.jspdf;

  // create new document
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // ---------- PAGE 1 : MEMBER CARD ----------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("GLOBAL HEALTH MISSION", 105, 20, { align: "center" });

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Organized by Bright Mission Social Welfare (NGO)",
    105,
    27,
    { align: "center" }
  );

  doc.setLineWidth(0.3);
  doc.rect(10, 35, 190, 80); // border around card

  doc.setFontSize(12);
  doc.text(`Member Name: ${member.name || ""}`, 15, 45);
  doc.text(`Member ID: ${member.member_id || ""}`, 15, 52);
  doc.text(`Age: ${member.age || ""}`, 15, 59);
  doc.text(`Gender: ${member.gender || ""}`, 60, 59);
  doc.text(`District: ${member.district || ""}`, 15, 66);
  doc.text(`Validity: ${formatDate(member.join_date)} → ${formatDate(member.expiry_date)}`, 15, 73);
  doc.text(`Contact: ${member.contact_number || ""}`, 15, 80);
  doc.text(`Aadhar: ${member.aadhar_number || ""}`, 15, 87);

  // add optional photo
  if (member.applicant_photo_url) {
    try {
      const imgData = await getImageAsBase64(member.applicant_photo_url);
      doc.addImage(imgData, "JPEG", 135, 45, 50, 50);
    } catch (e) {
      console.warn("Photo not added:", e);
    }
  }

  // ---------- PAGE 2 : INVOICE ----------
  doc.addPage();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("GLOBAL HEALTH MISSION", 105, 20, { align: "center" });
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Organized by Bright Mission Social Welfare (NGO)",
    105,
    27,
    { align: "center" }
  );

  doc.setLineWidth(0.2);
  doc.rect(10, 35, 190, 235); // border for receipt

  doc.setFontSize(12);
  doc.text(`Date: ${formatDate(member.join_date)}`, 15, 45);
  doc.text(`Member Name: ${member.name || ""}`, 15, 52);
  doc.text(`Member ID: ${member.member_id || ""}`, 15, 59);

  // table header
  const startY = 70;
  doc.setFont("helvetica", "bold");
  doc.text("Particulars", 15, startY);
  doc.text("Amount (₹)", 150, startY);
  doc.setLineWidth(0.1);
  doc.line(15, startY + 2, 190, startY + 2);

  doc.setFont("helvetica", "normal");
  let y = startY + 10;
  const items = [
    { name: "Registration Fee", amount: "100.00" },
    { name: "Health Card Printing", amount: "50.00" },
  ];
  let total = 0;
  items.forEach((item) => {
    doc.text(item.name, 15, y);
    doc.text(item.amount, 150, y, { align: "left" });
    total += parseFloat(item.amount);
    y += 8;
  });

  doc.line(15, y, 190, y);
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.text("Total", 15, y);
  doc.text(total.toFixed(2), 150, y);

  y += 15;
  doc.setFont("helvetica", "normal");
  doc.text("Payment Mode: Cash / UPI", 15, y);
  y += 8;
  doc.text(`Received By: ${member.created_by || "Admin"}`, 15, y);
  y += 20;
  doc.text("Authorized Sign: __________________________", 15, y);

  // ---------- Open in new tab ----------
  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, "_blank");
}

// ---------- Helper functions ----------
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB");
}

async function getImageAsBase64(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
