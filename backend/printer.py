from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from models import GHSLabel
import io

def generate_avery_5163_pdf(ghs_label: GHSLabel) -> io.BytesIO:
    """
    Generates a PDF for Avery 5163 (2" x 4") labels.
    Avery 5163: 2 columns, 5 rows.
    Horizontal Pitch: 4.125" (Label width 4" + Gutter 0.125")
    Vertical Pitch: 2" (No vertical gap)
    Margins: Top 0.5", Left 0.1875"
    """
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    # Avery 5163 Parameters
    label_width = 4 * inch
    label_height = 2 * inch
    margin_left = 0.1875 * inch
    margin_top = 0.5 * inch
    horizontal_gutter = 0.125 * inch
    
    for row in range(5):
        for col in range(2):
            x = margin_left + col * (label_width + horizontal_gutter)
            y = height - margin_top - (row + 1) * label_height
            
            # Content Padding
            padding = 0.15 * inch
            inner_x = x + padding
            content_width = label_width - (2 * padding)
            
            # Product Name (Auto-wrap via simple split if needed, but here just truncate)
            p.setFont("Helvetica-Bold", 12)
            p.drawString(inner_x, y + label_height - 0.3 * inch, ghs_label.product_identifier[:45])
            
            # Signal Word
            p.setFont("Helvetica-Bold", 11)
            if ghs_label.signal_word == "Danger":
                p.setFillColorRGB(0.8, 0, 0) # Red
            elif ghs_label.signal_word == "Warning":
                p.setFillColorRGB(0.9, 0.5, 0) # Orange/Yellow
            else:
                p.setFillColorRGB(0, 0, 0)
            p.drawString(inner_x, y + label_height - 0.55 * inch, ghs_label.signal_word.upper())
            p.setFillColorRGB(0, 0, 0) # Reset to black
            
            # Hazard Statements (Denser text)
            p.setFont("Helvetica", 8)
            y_offset = 0.75 * inch
            for stmt in ghs_label.hazard_statements[:4]:
                p.drawString(inner_x, y + label_height - y_offset, "• " + stmt[:70])
                y_offset += 0.14 * inch

            # Pictograms (Right Aligned)
            pic_size = 0.45 * inch
            pic_x = x + label_width - pic_size - 0.15 * inch
            pic_y = y + label_height - pic_size - 0.2 * inch
            for pic in ghs_label.pictograms[:2]:
                p.setLineWidth(1)
                p.rect(pic_x, pic_y, pic_size, pic_size)
                p.setFont("Helvetica-Bold", 6)
                p.drawCentredString(pic_x + pic_size/2, pic_y + 0.1 * inch, pic)
                pic_y -= (pic_size + 0.05 * inch)
                
            # Supplier Info (Bottom)
            p.setFont("Helvetica-Oblique", 6)
            p.drawString(inner_x, y + 0.15 * inch, ghs_label.supplier_info[:90])

    p.showPage()
    p.save()
    buffer.seek(0)
    return buffer
