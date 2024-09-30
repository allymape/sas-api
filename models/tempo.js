 <% for(var i = 0; i < applications.length; i++){  %>
          <%  const item = applications[i]; %>
          <%  const {status , payment_status , payment_status_id , reg_status} = item; %>
          <tr>
            <td class="id">
              <%- include('paginations/numbering.ejs' , {
                index : i }) 
              %>
            </td>
            <td class="">
              <%= item.tracking_number %>
            </td>
            <td class="">
              <%= item.school_name %>
            </td>
            <td class="">
              <%= item.category %>
            </td>
            <td class="">
              <%= item.region_name %> 
            </td>
            <td class="">
              <%= item.district_name %> 
            </td>
            <td class="">
              <%= item.ward_name %>
            </td>
            <td class="">
              <%= item.street_name %>
            </td>
            <td class=""><%=item.applicant_name %></td>
            <td class=""><%= dateFormat(item.application_created_at , "DD/MM/YYYY HH:mm:ss") %></td>
            <td class="">
                <% if(status == 1 || status == 0) {%>
                <%= item.title ? item.title : 'W1' %> %>
                <% } %>
            </td>
            <td class=""><%= dateFormat(item.submitted_created_at , "DD/MM/YYYY HH:mm:ss") %></td>
            <td class="">
              <%  if(payment_status_id == 2){ %>
                <span class="badge bg-<%= status == 1 || status == '' ? `info` : ( status == 2 ? 'success' : (status == 3 ? 'danger' : 'warning'))%>">
                    <%= status == 1 || status == 0 || status == '' ? `Linashughulikiwa` : ( status == 2 ? 'Limethibitishwa' : (status == 3 ? 'Limekatiliwa' : 'Limerudishwa')) %>
                </span>
              <% } %>
            </td>
            <td>
                <span class="<%= payment_status_id == 1 ? 'badge bg-danger' : (payment_status_id == 2 ? 'badge bg-success' : '')%>">
                    <%=payment_status%>
                </span>
                <% if(!payment_status){ %>
                  <button type="button" class="btn btn-sm btn-soft-primary btn-make-payment" 
                  onclick="makePayment(this)" data-tracking_number="<%= item.tracking_number %>" >Lipa</button>
                <% } %>
            </td>
              <td class="text-center">
                  <div class="dropdown">
                      <a href="#" role="button" id="dropdownMenuLink" data-bs-toggle="dropdown" aria-expanded="false">
                          <i class="ri-more-2-fill"></i>
                      </a>
                      <ul class="dropdown-menu" aria-labelledby="dropdownMenuLink">
                          <li><a class="dropdown-item" href="/Barua/<%= item.tracking_number %>">Barua</a></li>
                      </ul>
                  </div>
              </td>
          </tr>
          <% } %> 