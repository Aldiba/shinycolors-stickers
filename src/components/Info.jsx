import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";

export default function Info({ open, handleClose, config }) {
  return (
    <div>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">About</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            <Typography variant="h6" component="h3">
              This tool made possible by:
            </Typography>
            <List>
              <ListItem
                button
                onClick={() =>
                  (window.location.href = "https://github.com/TheOriginalAyaka")
                }
              >
                <ListItemAvatar>
                  <Avatar
                    alt="TheOriginalAyaka"
                    src="https://avatars.githubusercontent.com/TheOriginalAyaka"
                  />
                </ListItemAvatar>
                <ListItemText
                  primary="TheOriginalAyaka"
                  secondary="creator of sekai-stickers"
                />
              </ListItem>

              <ListItem
                button
                onClick={() =>
                  (window.location.href = "https://github.com/Aldiba")
                }
              >
                <ListItemAvatar>
                  <Avatar
                    alt="Aldiba"
                    src="https://avatars.githubusercontent.com/Aldiba"
                  />
                </ListItemAvatar>
                <ListItemText
                  primary="Aldiba"
                  secondary="外星生物"
                />
              </ListItem>
              
            </List>
            <Typography variant="h6" component="h3">
              You can find the source code or contribute here:
            </Typography>
            <List>
              <ListItem
                button
                onClick={() =>
                  (window.location.href =
                    "https://github.com/Aldiba/shinycolors-stickers")
                }
              >
                <ListItemAvatar>
                  <Avatar
                    alt="GitHub"
                    src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
                  />
                </ListItemAvatar>
                <ListItemText primary="GitHub" secondary="Source Code" />
              </ListItem>
            </List>
            <Typography variant="h6" component="h3">
              Total stickers made using the app:
              <br />
              {config?.global
                ? config?.global.toLocaleString() + " Sticker"
                : "not available"}
            </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary" autoFocus>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
