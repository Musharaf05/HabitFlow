document.addEventListener('DOMContentLoaded', () => {
  // Tab switching (visual only)
  const tabs = document.querySelectorAll('.top-tabs .tab');
  tabs.forEach(tab => tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
  }));

  // Add task functionality
  const addBtn = document.querySelector('.btn.add');
  const newTaskInput = document.querySelector('.new-task');
  const pickTags = document.querySelector('.pick-tags');
  const tasksList = document.querySelector('.tasks-list');

  function pad(n){return String(n).padStart(2,'0')}
  function formatDate(date){
    const d = date instanceof Date ? date : new Date();
    const dd = pad(d.getDate());
    const mm = pad(d.getMonth()+1);
    const yyyy = d.getFullYear();
    return { display: `${dd}/${mm}/${yyyy}`, datetime: `${yyyy}-${mm}-${dd}` };
  }

  function createTaskRow(title, tag, statusText='NOT STARTED', statusClass='not-started', dateObj=new Date()){
    const li = document.createElement('li'); li.className='task-row';

    const colStatus = document.createElement('div'); colStatus.className='col col-status';
    const spanStatus = document.createElement('span'); spanStatus.className=`status ${statusClass}`; spanStatus.textContent = statusText;
    colStatus.appendChild(spanStatus);

    const colTask = document.createElement('div'); colTask.className='col col-task';
    const divTitle = document.createElement('div'); divTitle.className='task-title'; divTitle.textContent = title;
    colTask.appendChild(divTitle);

    const colTag = document.createElement('div'); colTag.className='col col-tag'; colTag.textContent = tag || '';

    const colDate = document.createElement('div'); colDate.className='col col-date';
    const time = document.createElement('time');
    const f = formatDate(dateObj);
    time.setAttribute('datetime', f.datetime);
    time.textContent = f.display;
    colDate.appendChild(time);

    li.appendChild(colStatus);
    li.appendChild(colTask);
    li.appendChild(colTag);
    li.appendChild(colDate);

    return li;
  }

  if(addBtn){
    addBtn.addEventListener('click', () => {
      const title = newTaskInput.value.trim();
      if(!title){ newTaskInput.focus(); return; }
      const tag = pickTags ? pickTags.value : '';
      const row = createTaskRow(title, tag, 'NOT STARTED', 'not-started', new Date());
      tasksList.appendChild(row);
      // scroll into view
      row.scrollIntoView({behavior:'smooth', block:'nearest'});
      newTaskInput.value = '';
      if(pickTags) pickTags.selectedIndex = 0;
      newTaskInput.focus();
    });
  }

  if(newTaskInput){
    newTaskInput.addEventListener('keydown', (e) => {
      if(e.key === 'Enter'){
        e.preventDefault();
        addBtn && addBtn.click();
      }
    });
  }

  const calBtn = document.querySelector('.btn.calendar');
  if(calBtn){ calBtn.addEventListener('click', ()=> newTaskInput.focus()); }

});
