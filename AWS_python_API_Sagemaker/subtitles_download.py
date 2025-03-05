import os
from subliminal import download_best_subtitles, region, Video

# Configure cache for subliminal
region.configure('dogpile.cache.dbm', arguments={'filename': 'cachefile.dbm'})

# List of popular German words/phrases to use as random search queries
SEARCH_TERMS = ["Liebe", "Freund", "Abenteuer", "Reise", "Familie", "Geheimnis", 
                "Kampf", "Traum", "Hoffnung", "Zukunft", "Schule", "Ferien", 
                "Pauker", "Lehrer", "Technik"]

# Path to save downloaded subtitles
save_path = '.'

total_size = 0
target_size = 600 * 1024 * 1024  # 600 MB

for term in SEARCH_TERMS:
    if total_size < target_size:
        # Create a mock Video object with the search term as its name
        video = Video.fromname(term + '.mkv')
        subtitles = download_best_subtitles([video], { 'de' })  # 'de' for German
        
        if video in subtitles and subtitles[video]:  # Check if we got any subtitles
            file_name = os.path.join(save_path, term + '.srt')
            subtitles[video][0].save(file_name)
            total_size += os.path.getsize(file_name)
        else:
            print(f"No subtitles found for {term}")

print("Done!")
