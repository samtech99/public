import os
import xml.etree.ElementTree as ET


root_folder = "/Users/user01/dissertation/de/OpenSubtitles"
output_folder = "."  

def xml_to_srt(xml_path, srt_path):
    tree = ET.parse(xml_path)
    root = tree.getroot()

    with open(srt_path, 'w', encoding='utf-8') as srt_file:
        for i, subtitle in enumerate(root.findall('s')):
            # Safely fetch the start and end times
            start_time_element = subtitle.find('time[@id="T{}S"]'.format(i + 1))
            end_time_element = subtitle.find('time[@id="T{}E"]'.format(i + 1))

            if start_time_element is None or end_time_element is None:
                # Skip this subtitle entry if either time is missing
                continue

            start_time = start_time_element.get('value')
            end_time = end_time_element.get('value')
            text_lines = [word.text for word in subtitle.findall('w')]

            srt_file.write(f"{i+1}\n")
            srt_file.write(f"{start_time} --> {end_time}\n")
            srt_file.write(' '.join(text_lines) + "\n\n")


def find_xml_files_and_convert(root_folder, output_folder):
    # First, gather all the xml files into a list
    all_xml_files = [os.path.join(dirpath, filename) for dirpath, _, filenames in os.walk(root_folder) for filename in filenames if filename.endswith('.xml')]
    
    total_files = len(all_xml_files)
    
    for idx, xml_path in enumerate(all_xml_files, start=1):
        print(f"Processing {idx}/{total_files}: {xml_path}")

        # Construct the path for the SRT file in the desired output directory
        srt_filename = os.path.basename(os.path.splitext(xml_path)[0] + '.srt')
        srt_path = os.path.join(output_folder, srt_filename)
        
        xml_to_srt(xml_path, srt_path)




find_xml_files_and_convert(root_folder, output_folder)





