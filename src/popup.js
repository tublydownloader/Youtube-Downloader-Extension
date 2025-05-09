document.addEventListener('DOMContentLoaded', () => {
  const noVideoSection = document.getElementById('no-video');
  const videoInfoSection = document.getElementById('video-info');
  const videoThumbnail = document.getElementById('video-thumbnail');
  const videoTitle = document.getElementById('video-title');
  const videoDuration = document.getElementById('video-duration');
  const channelName = document.getElementById('channel-name');
  const videoQualities = document.getElementById('video-qualities');
  const audioQualities = document.getElementById('audio-qualities');
  const progressContainer = document.getElementById('download-progress');
  const progressBar = document.getElementById('progress');
  const progressText = document.getElementById('progress-text');
  const openYouTubeBtn = document.getElementById('open-youtube');
  const settingsBtn = document.getElementById('settings-btn');
  
  // Current video information
  let currentVideo = null;

  // Check if we're on a YouTube video page
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    const currentTab = tabs[0];
    const url = currentTab.url;
    
    if (isYouTubeVideoUrl(url)) {
      // We're on a YouTube video page
      noVideoSection.classList.add('hidden');
      videoInfoSection.classList.remove('hidden');
      
      // Get video information
      chrome.tabs.sendMessage(currentTab.id, {action: 'getVideoInfo'}, (response) => {
        if (response && response.videoInfo) {
          displayVideoInfo(response.videoInfo);
        } else {
          showError('Could not retrieve video information');
        }
      });
    } else {
      // Not on a YouTube video page
      noVideoSection.classList.remove('hidden');
      videoInfoSection.classList.add('hidden');
    }
  });
  
  // Handle "Go to YouTube" button click
  openYouTubeBtn.addEventListener('click', () => {
    chrome.tabs.create({url: 'https://www.youtube.com'});
  });
  
  // Handle settings button click
  settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
  
  // Display video information
  function displayVideoInfo(videoInfo) {
    currentVideo = videoInfo;
    
    videoThumbnail.src = videoInfo.thumbnail;
    videoTitle.textContent = videoInfo.title;
    videoDuration.textContent = formatDuration(videoInfo.duration);
    channelName.textContent = videoInfo.channelName;
    
    // Display video quality options
    videoQualities.innerHTML = '';
    videoInfo.videoQualities.forEach(quality => {
      const qualityBtn = createQualityButton(quality, 'video');
      videoQualities.appendChild(qualityBtn);
    });
    
    // Display audio quality options
    audioQualities.innerHTML = '';
    videoInfo.audioQualities.forEach(quality => {
      const qualityBtn = createQualityButton(quality, 'audio');
      audioQualities.appendChild(qualityBtn);
    });
  }
  
  // Create quality selection button
  function createQualityButton(quality, type) {
    const button = document.createElement('button');
    button.classList.add('quality-btn');
    button.setAttribute('data-quality', quality.id);
    button.setAttribute('data-type', type);
    
    if (type === 'video') {
      button.textContent = `${quality.label} (${quality.fileSize})`;
    } else {
      button.textContent = `${quality.label} MP3 (${quality.fileSize})`;
    }
    
    button.addEventListener('click', () => {
      initiateDownload(quality, type);
    });
    
    return button;
  }
  
  // Initiate download process
  function initiateDownload(quality, type) {
    progressContainer.classList.remove('hidden');
    progressText.textContent = 'Preparing download...';
    progressBar.style.width = '0%';
    
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      const currentTab = tabs[0];
      
      chrome.tabs.sendMessage(
        currentTab.id, 
        {
          action: 'downloadVideo',
          qualityId: quality.id,
          type: type,
          videoId: currentVideo.id
        }, 
        (response) => {
          if (response && response.success) {
            updateDownloadProgress(0);
            
            // Simulate download progress
            const downloadInterval = setInterval(() => {
              const currentWidth = parseInt(progressBar.style.width, 10) || 0;
              if (currentWidth >= 100) {
                clearInterval(downloadInterval);
                progressText.textContent = 'Download complete!';
                setTimeout(() => {
                  progressContainer.classList.add('hidden');
                }, 2000);
              } else {
                updateDownloadProgress(currentWidth + 5);
              }
            }, 300);
          } else {
            showError('Failed to start download');
          }
        }
      );
    });
  }
  
  // Update download progress
  function updateDownloadProgress(percent) {
    progressBar.style.width = `${percent}%`;
    if (percent < 100) {
      progressText.textContent = `Downloading: ${percent}%`;
    }
  }
  
  // Show error message
  function showError(message) {
    progressContainer.classList.remove('hidden');
    progressText.textContent = message;
    progressBar.style.width = '100%';
    progressBar.style.backgroundColor = '#f44336';
  }
  
  // Check if URL is a YouTube video
  function isYouTubeVideoUrl(url) {
    return /^(https?:\/\/)?(www\.)?(youtube\.com\/watch|youtu\.be\/|youtube\.com\/shorts)/.test(url);
  }
  
  // Format duration from seconds to MM:SS
  function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
});
