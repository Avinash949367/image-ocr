from image_preprocessing import preprocess_image
from ocr_engine import extract_text
import cv2

image_path = "sample_images/images.jpg"

processed = preprocess_image(image_path)
cv2.imwrite("output/processed.png", processed)

text = extract_text(image_path)

with open("output/extracted_text.txt", "w", encoding="utf-8") as f:
    f.write(text)

print("Text extraction completed")
print(text)
